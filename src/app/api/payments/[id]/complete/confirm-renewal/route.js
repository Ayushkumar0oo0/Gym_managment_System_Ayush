import { NextResponse } from "next/server";

import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Payment from "@/models/Payment";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";

export async function POST(request, { params }) {
  let mongoSession = null;

  try {
    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. ADMIN CHECK
    // ==========================================

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins can confirm cash payments.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 3. RESOLVE PAYMENT ID
    // ==========================================

    const resolvedParams = await params;
    const paymentId = resolvedParams?.id;

    if (
      typeof paymentId !== "string" ||
      !mongoose.isValidObjectId(paymentId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. OPTIONAL NOTES
    // ==========================================

    let body = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const adminNotes =
      typeof body?.notes === "string"
        ? body.notes.trim().slice(0, 1000)
        : "";

    // ==========================================
    // 5. DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // 6. START TRANSACTION
    // ==========================================

    mongoSession = await mongoose.startSession();

    let result = null;

    await mongoSession.withTransaction(async () => {
      // ========================================
      // 7. FIND PAYMENT
      // ========================================

      const payment = await Payment.findById(
        paymentId
      ).session(mongoSession);

      if (!payment) {
        throw new Error("Payment not found.");
      }

      // ========================================
      // 8. PAYMENT TYPE
      // ========================================

      if (payment.paymentType !== "renewal") {
        throw new Error(
          "This payment is not a membership renewal."
        );
      }

      // ========================================
      // 9. PAYMENT METHOD
      // ========================================

      if (payment.method !== "cash") {
        throw new Error(
          "Only cash renewal payments can be confirmed here."
        );
      }

      // ========================================
      // 10. IDEMPOTENCY
      // ========================================

      if (payment.status === "paid") {
        result = {
          alreadyConfirmed: true,
          paymentId: payment._id,
          membershipId: payment.membership,
        };

        return;
      }

      if (payment.status !== "pending") {
        throw new Error(
          "This payment cannot be confirmed in its current state."
        );
      }

      // ========================================
      // 11. FIND USER
      // ========================================

      const user = await User.findById(
        payment.user
      ).session(mongoSession);

      if (!user) {
        throw new Error("User not found.");
      }

      if (!user.isActive) {
        throw new Error(
          "User account is inactive."
        );
      }

      // ========================================
      // 12. FIND EXISTING MEMBERSHIP
      // ========================================

      if (!payment.membership) {
        throw new Error(
          "Existing membership is missing from this renewal."
        );
      }

      const membership =
        await Membership.findById(
          payment.membership
        ).session(mongoSession);

      if (!membership) {
        throw new Error(
          "Membership not found."
        );
      }

      if (
        String(membership.user) !==
        String(user._id)
      ) {
        throw new Error(
          "Membership does not belong to this member."
        );
      }

      if (
        !["active", "expired"].includes(
          membership.status
        )
      ) {
        throw new Error(
          "This membership cannot be renewed."
        );
      }

      // ========================================
      // 13. FIND PLAN
      // ========================================

      if (!payment.membershipPlan) {
        throw new Error(
          "Renewal membership plan is missing."
        );
      }

      const plan =
        await MembershipPlan.findById(
          payment.membershipPlan
        ).session(mongoSession);

      if (!plan) {
        throw new Error(
          "Membership plan not found."
        );
      }

      if (!plan.isActive) {
        throw new Error(
          "Membership plan is no longer active."
        );
      }

      // ========================================
      // 14. VALIDATE PLAN ELIGIBILITY
      // ========================================

      if (
        plan.eligibility !== "both" &&
        plan.eligibility !== user.gender
      ) {
        throw new Error(
          "Member is not eligible for this membership plan."
        );
      }

      // ========================================
      // 15. VALIDATE PRICE
      // ========================================

      const planPrice = Number(plan.price);
      const paymentAmount = Number(payment.amount);

      if (
        !Number.isFinite(planPrice) ||
        planPrice < 0
      ) {
        throw new Error(
          "Membership plan has an invalid price."
        );
      }

      if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount < 0
      ) {
        throw new Error(
          "Payment amount is invalid."
        );
      }

      // Renewal must equal the selected plan price.
      // No registration fee is charged.
      if (paymentAmount !== planPrice) {
        throw new Error(
          "Renewal payment amount does not match the membership plan price."
        );
      }

      // ========================================
      // 16. VALIDATE DURATION
      // ========================================

      const durationInDays =
        Number(plan.durationInDays);

      if (
        !Number.isInteger(durationInDays) ||
        durationInDays < 1
      ) {
        throw new Error(
          "Membership plan has an invalid duration."
        );
      }

      // ========================================
      // 17. CALCULATE NEW MEMBERSHIP DATES
      // ========================================

      const now = new Date();

      const oldEndDate = new Date(
        membership.endDate
      );

      if (
        Number.isNaN(oldEndDate.getTime())
      ) {
        throw new Error(
          "Membership end date is invalid."
        );
      }

      const membershipIsStillActive =
        membership.status === "active" &&
        oldEndDate > now;

      let renewalStartDate;

      if (membershipIsStillActive) {
        // Preserve all remaining membership days.
        renewalStartDate = new Date(
          oldEndDate
        );
      } else {
        // Expired membership starts again today.
        renewalStartDate = new Date(now);
      }

      const newEndDate =
        new Date(renewalStartDate);

      newEndDate.setUTCDate(
        newEndDate.getUTCDate() +
          durationInDays
      );

      // ========================================
      // 18. UPDATE MEMBERSHIP
      // ========================================

      membership.startDate =
        membershipIsStillActive
          ? membership.startDate
          : now;

      membership.endDate = newEndDate;

      membership.status = "active";

      membership.plan = plan._id;

      membership.priceAtPurchase =
        paymentAmount;

      await membership.save({
        session: mongoSession,
      });

      // ========================================
      // 19. UPDATE PAYMENT
      // ========================================

      payment.status = "paid";

      payment.paidAt = now;

      payment.recordedBy =
        session.user.id;

      payment.receivedBy =
        session.user.id;

      if (adminNotes) {
        payment.notes =
          payment.notes
            ? `${payment.notes}\nAdmin: ${adminNotes}`
            : `Admin: ${adminNotes}`;
      }

      await payment.save({
        session: mongoSession,
      });

      // ========================================
      // 20. RESULT
      // ========================================

      result = {
        alreadyConfirmed: false,

        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          paymentType:
            payment.paymentType,
        },

        member: {
          id: user._id,
          name: user.name,
          phone: user.phone,
        },

        membership: {
          id: membership._id,
          plan: plan.name,
          durationInDays,
          previousEndDate: oldEndDate,
          renewalStartDate,
          newEndDate,
          status: membership.status,
        },

        confirmedBy: session.user.id,
      };
    });

    // ==========================================
    // 21. CLOSE TRANSACTION
    // ==========================================

    await mongoSession.endSession();
    mongoSession = null;

    // ==========================================
    // 22. RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        message: result.alreadyConfirmed
          ? "This renewal payment was already confirmed."
          : "Cash renewal payment confirmed and membership extended.",

        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "CASH RENEWAL CONFIRMATION ERROR:",
      error
    );

    if (mongoSession) {
      try {
        await mongoSession.endSession();
      } catch (sessionError) {
        console.error(
          "Failed to close MongoDB session:",
          sessionError
        );
      }
    }

    const knownMessages = [
      "Payment not found.",
      "This payment is not a membership renewal.",
      "Only cash renewal payments can be confirmed here.",
      "This payment cannot be confirmed in its current state.",
      "User not found.",
      "User account is inactive.",
      "Existing membership is missing from this renewal.",
      "Membership not found.",
      "Membership does not belong to this member.",
      "This membership cannot be renewed.",
      "Renewal membership plan is missing.",
      "Membership plan not found.",
      "Membership plan is no longer active.",
      "Member is not eligible for this membership plan.",
      "Membership plan has an invalid price.",
      "Payment amount is invalid.",
      "Renewal payment amount does not match the membership plan price.",
      "Membership plan has an invalid duration.",
      "Membership end date is invalid.",
    ];

    const message =
      knownMessages.includes(error?.message)
        ? error.message
        : "Failed to confirm cash renewal payment.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: knownMessages.includes(
          error?.message
        )
          ? 400
          : 500,
      }
    );
  }
}