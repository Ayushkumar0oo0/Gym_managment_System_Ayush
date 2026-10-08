import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { adminRateLimit, rateLimitResponse } from "@/lib/rateLimit";

import Payment from "@/models/Payment";
import User from "@/models/User";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";

export async function POST(request, { params }) {
  let mongoSession = null;

  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // ADMIN ONLY
    // ==========================================

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // RATE LIMIT
    // ==========================================

    const rateLimitResult = await adminRateLimit.limit(
      `admin-renewal-confirm:${session.user.id}`
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // ==========================================
    // PARAMS
    // ==========================================

    const resolvedParams = await params;

    const paymentId = resolvedParams?.id;

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        paymentId
      )
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
    // DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // TRANSACTION
    // ==========================================

    mongoSession = await mongoose.startSession();

    mongoSession.startTransaction();

    // ==========================================
    // FIND PAYMENT
    // ==========================================

    const payment =
      await Payment.findById(paymentId)
        .session(mongoSession);

    if (!payment) {
      throw new Error(
        "Payment not found."
      );
    }

    // ==========================================
    // IDEMPOTENCY
    // ==========================================

    if (payment.status === "paid") {
      await mongoSession.commitTransaction();

      return NextResponse.json(
        {
          success: true,
          message:
            "Renewal payment has already been confirmed.",
          alreadyCompleted: true,
          payment: {
            id: payment._id,
            status: payment.status,
            amount: payment.amount,
            method: payment.method,
            paymentType:
              payment.paymentType,
            paidAt: payment.paidAt,
            membership:
              payment.membership,
          },
        },
        { status: 200 }
      );
    }

    // ==========================================
    // PAYMENT TYPE
    // ==========================================

    if (
      payment.paymentType !== "renewal"
    ) {
      throw new Error(
        "This payment is not a membership renewal payment."
      );
    }

    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    if (payment.method !== "cash") {
      throw new Error(
        "Only cash renewal payments can be confirmed by an admin."
      );
    }

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    if (payment.status !== "pending") {
      throw new Error(
        `This payment cannot be confirmed because its current status is "${payment.status}".`
      );
    }

    // ==========================================
    // USER
    // ==========================================

    if (!payment.user) {
      throw new Error(
        "Payment is not linked to a member."
      );
    }

    const user = await User.findById(
      payment.user
    ).session(mongoSession);

    if (!user) {
      throw new Error(
        "Member account not found."
      );
    }

    if (!user.isActive) {
      throw new Error(
        "Member account is inactive."
      );
    }

    if (user.role !== "member") {
      throw new Error(
        "This account is not a member account."
      );
    }

    // ==========================================
    // MEMBERSHIP
    // ==========================================

    if (!payment.membership) {
      throw new Error(
        "Renewal payment is not linked to an existing membership."
      );
    }

    const membership =
      await Membership.findById(
        payment.membership
      ).session(mongoSession);

    if (!membership) {
      throw new Error(
        "Existing membership not found."
      );
    }

    // ==========================================
    // OWNERSHIP
    // ==========================================

    if (
      membership.user.toString() !==
      user._id.toString()
    ) {
      throw new Error(
        "Membership does not belong to this member."
      );
    }

    // ==========================================
    // COUPLE MEMBERSHIP
    // ==========================================

    if (
      membership.membershipType ===
      "couple"
    ) {
      throw new Error(
        "Couple membership renewal requires admin assistance."
      );
    }

    // ==========================================
    // MEMBERSHIP PLAN
    // ==========================================

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
        "This membership plan is no longer active."
      );
    }

    // ==========================================
    // PLAN ELIGIBILITY
    // ==========================================

    if (
      plan.eligibility !== "both" &&
      plan.eligibility !== user.gender
    ) {
      throw new Error(
        "This membership plan is not available for this member."
      );
    }

    // ==========================================
    // PLAN PRICE
    // ==========================================

    const planPrice = Number(
      plan.price
    );

    if (
      !Number.isFinite(planPrice) ||
      planPrice < 0
    ) {
      throw new Error(
        "Membership plan has an invalid price."
      );
    }

    // ==========================================
    // PLAN DURATION
    // ==========================================

    const durationInDays = Number(
      plan.durationInDays
    );

    if (
      !Number.isInteger(
        durationInDays
      ) ||
      durationInDays < 1
    ) {
      throw new Error(
        "Membership plan has an invalid duration."
      );
    }

    // ==========================================
    // PAYMENT AMOUNT
    // ==========================================

    if (
      Number(payment.amount) !==
      planPrice
    ) {
      throw new Error(
        "Payment amount does not match the current membership plan price."
      );
    }

    // ==========================================
    // CURRENT TIME
    // ==========================================

    const now = new Date();

    // ==========================================
    // RENEWAL START
    // ==========================================

    let renewalStartDate;

    if (
      membership.status === "active" &&
      membership.endDate &&
      membership.endDate > now
    ) {
      // Preserve remaining membership days.

      renewalStartDate =
        new Date(membership.endDate);
    } else {
      // Expired membership starts again today.

      renewalStartDate =
        new Date(now);

      membership.startDate =
        renewalStartDate;
    }

    // ==========================================
    // RENEWAL END
    // ==========================================

    const renewalEndDate =
      new Date(renewalStartDate);

    renewalEndDate.setDate(
      renewalEndDate.getDate() +
        durationInDays
    );

    // ==========================================
    // UPDATE MEMBERSHIP
    // ==========================================

    membership.plan =
      plan._id;

    membership.startDate =
      membership.startDate ||
      renewalStartDate;

    membership.endDate =
      renewalEndDate;

    membership.status =
      "active";

    membership.priceAtPurchase =
      planPrice;

    await membership.save({
      session: mongoSession,
    });

    // ==========================================
    // UPDATE PAYMENT
    // ==========================================

    payment.status = "paid";

    payment.paidAt = new Date();

    payment.transactionId =
      payment.transactionId ||
      `CASH-RENEWAL-${payment._id.toString()}`;

    payment.membership =
      membership._id;

    payment.membershipPlan =
      plan._id;

    payment.membershipStartDate =
      renewalStartDate;

    // The admin who recorded and received
    // this cash payment.

    payment.recordedBy =
      session.user.id;

    payment.receivedBy =
      session.user.id;

    payment.notes =
      payment.notes ||
      `Membership renewal: ${plan.name}`;

    await payment.save({
      session: mongoSession,
    });

    // ==========================================
    // COMMIT
    // ==========================================

    await mongoSession.commitTransaction();

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Cash membership renewal confirmed successfully.",

        payment: {
          id: payment._id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          paymentType:
            payment.paymentType,
          transactionId:
            payment.transactionId,
          paidAt: payment.paidAt,
          recordedBy:
            payment.recordedBy,
          receivedBy:
            payment.receivedBy,
        },

        membership: {
          id: membership._id,
          planId: plan._id,
          planName: plan.name,
          price: planPrice,
          durationInDays,
          startDate:
            membership.startDate,
          endDate:
            membership.endDate,
          status:
            membership.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // ==========================================
    // ABORT TRANSACTION
    // ==========================================

    if (
      mongoSession &&
      mongoSession.inTransaction()
    ) {
      try {
        await mongoSession.abortTransaction();
      } catch (abortError) {
        console.error(
          "ABORT CASH RENEWAL ERROR:",
          abortError
        );
      }
    }

    console.error(
      "CONFIRM CASH RENEWAL ERROR:",
      error
    );

    const knownErrors = [
      "Payment not found.",
      "This payment is not a membership renewal payment.",
      "Only cash renewal payments can be confirmed by an admin.",
      "Existing membership not found.",
      "Renewal payment is not linked to an existing membership.",
      "Membership does not belong to this member.",
      "Couple membership renewal requires admin assistance.",
      "Renewal membership plan is missing.",
      "Membership plan not found.",
      "This membership plan is no longer active.",
      "This membership plan is not available for this member.",
      "Membership plan has an invalid price.",
      "Membership plan has an invalid duration.",
      "Payment amount does not match the current membership plan price.",
      "Member account not found.",
      "Member account is inactive.",
      "This account is not a member account.",
    ];

    const isKnownError =
      knownErrors.includes(
        error?.message
      ) ||
      error?.message?.startsWith(
        "This payment cannot be confirmed"
      );

    return NextResponse.json(
      {
        success: false,
        message: isKnownError
          ? error.message
          : "Failed to confirm cash membership renewal.",
      },
      {
        status: isKnownError
          ? 400
          : 500,
      }
    );
  } finally {
    if (mongoSession) {
      await mongoSession.endSession();
    }
  }
}