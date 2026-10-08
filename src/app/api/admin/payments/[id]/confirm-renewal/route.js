import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import {
  adminRateLimit,
  createRateLimitIdentifier,
  rateLimitResponse,
  getClientIp,
} from "@/lib/rateLimit";

import Payment from "@/models/Payment";
import User from "@/models/User";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";

/* =========================================================
   HELPERS
========================================================= */

function extractNumberFromNotes(notes, pattern) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const match = notes.match(pattern);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  return Number.isFinite(value) ? value : null;
}

function extractPlanPriceFromNotes(notes) {
  return extractNumberFromNotes(
    notes,
    /Plan price:\s*₹?\s*([0-9]+(?:\.[0-9]+)?)/i
  );
}

function extractDurationFromNotes(notes) {
  const duration = extractNumberFromNotes(
    notes,
    /Duration:\s*(\d+)\s*days/i
  );

  if (
    duration === null ||
    !Number.isInteger(duration) ||
    duration < 1
  ) {
    return null;
  }

  return duration;
}

function extractRenewalStartFromNotes(notes) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const match = notes.match(
    /Renewal start:\s*([0-9T:.+\-Z]+)\b/i
  );

  if (!match) {
    return null;
  }

  const date = new Date(match[1]);

  return Number.isNaN(date.getTime()) ? null : date;
}

/* =========================================================
   POST
========================================================= */

export async function POST(request, { params }) {
  let dbSession = null;

  try {
    /* =====================================================
       1. AUTHENTICATION
    ===================================================== */

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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const adminId = session.user.id;

    /* =====================================================
       2. RATE LIMIT
    ===================================================== */

    const clientIp = getClientIp(request);

    const rateLimitResult = await adminRateLimit.limit(
      createRateLimitIdentifier(
        "admin-confirm-renewal",
        `${adminId}:${clientIp}`
      )
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    /* =====================================================
       3. PAYMENT ID
    ===================================================== */

    const resolvedParams = await params;
    const paymentId = resolvedParams?.id;

    if (
      !paymentId ||
      !mongoose.Types.ObjectId.isValid(paymentId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       4. DATABASE
    ===================================================== */

    await connectDB();

    /* =====================================================
       5. VERIFY ACTIVE ADMIN
    ===================================================== */

    const currentAdmin = await User.findOne({
      _id: adminId,
      role: "admin",
      isActive: true,
    }).select("_id name email");

    if (!currentAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your admin account is inactive or unavailable.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       6. TRANSACTION
    ===================================================== */

    dbSession = await mongoose.startSession();

    let result = null;

    await dbSession.withTransaction(async () => {
      /* ===================================================
         FIND PAYMENT
      =================================================== */

      const payment = await Payment.findById(
        paymentId
      ).session(dbSession);

      if (!payment) {
        throw new Error("Payment not found.");
      }

      /* ===================================================
         PAYMENT TYPE
      =================================================== */

      if (payment.paymentType !== "renewal") {
        throw new Error(
          "This payment is not a membership renewal."
        );
      }

      /* ===================================================
         PAYMENT METHOD
      =================================================== */

      if (payment.method !== "cash") {
        throw new Error(
          "Only cash renewal payments can be confirmed here."
        );
      }

      /* ===================================================
         IDEMPOTENCY
      =================================================== */

      if (payment.status === "paid") {
        result = {
          alreadyProcessed: true,
          payment,
        };

        return;
      }

      /* ===================================================
         PAYMENT MUST BE PENDING
      =================================================== */

      if (payment.status !== "pending") {
        throw new Error(
          "This payment is no longer pending."
        );
      }

      /* ===================================================
         FIND USER
      =================================================== */

      if (!payment.user) {
        throw new Error("Member account not found.");
      }

      const user = await User.findById(
        payment.user
      ).session(dbSession);

      if (!user) {
        throw new Error("Member account not found.");
      }

      if (user.role !== "member") {
        throw new Error(
          "This payment does not belong to a member account."
        );
      }

      if (!user.isActive) {
        throw new Error(
          "This member account is inactive."
        );
      }

      /* ===================================================
         FIND MEMBERSHIP
      =================================================== */

      if (!payment.membership) {
        throw new Error(
          "No membership is linked to this renewal payment."
        );
      }

      const membership = await Membership.findById(
        payment.membership
      ).session(dbSession);

      if (!membership) {
        throw new Error("Membership not found.");
      }

      /* ===================================================
         VERIFY OWNERSHIP
      =================================================== */

      const isPrimaryMember =
        membership.user &&
        String(membership.user) === String(user._id);

      const isSecondaryMember =
        membership.secondaryUser &&
        String(membership.secondaryUser) === String(user._id);

      if (!isPrimaryMember && !isSecondaryMember) {
        throw new Error(
          "Membership does not belong to this member."
        );
      }

      /* ===================================================
         COUPLE MEMBERSHIP
         
         Existing business rule intentionally prevents
         automatic renewal of couple memberships because
         the couple renewal flow requires additional
         member handling.
      =================================================== */

      if (
        membership.membershipType === "couple" ||
        membership.secondaryUser
      ) {
        throw new Error(
          "Couple membership renewal requires admin assistance."
        );
      }

      /* ===================================================
         FIND PLAN
      =================================================== */

      if (!payment.membershipPlan) {
        throw new Error(
          "No membership plan is linked to this renewal payment."
        );
      }

      const plan = await MembershipPlan.findById(
        payment.membershipPlan
      ).session(dbSession);

      if (!plan) {
        throw new Error("Membership plan not found.");
      }

      /* ===================================================
         PLAN ACTIVE
      =================================================== */

      if (!plan.isActive) {
        throw new Error(
          "The selected membership plan is no longer active."
        );
      }

      /* ===================================================
         GENDER ELIGIBILITY
      =================================================== */

      if (
        plan.eligibility !== "both" &&
        plan.eligibility !== user.gender
      ) {
        throw new Error(
          "This membership plan is not available for this member."
        );
      }

      /* ===================================================
         HISTORICAL PRICE
      =================================================== */

      const historicalPlanPrice =
        extractPlanPriceFromNotes(payment.notes);

      const currentPlanPrice = Number(plan.price);

      const planPrice =
        historicalPlanPrice !== null
          ? historicalPlanPrice
          : currentPlanPrice;

      if (
        !Number.isFinite(planPrice) ||
        planPrice < 0
      ) {
        throw new Error(
          "Invalid membership plan price."
        );
      }

      /* ===================================================
         VERIFY PAYMENT AMOUNT
      =================================================== */

      const paidAmount = Number(payment.amount);

      if (
        !Number.isFinite(paidAmount) ||
        paidAmount <= 0 ||
        paidAmount !== planPrice
      ) {
        throw new Error(
          `Payment amount does not match the renewal plan price. Expected ₹${planPrice}, received ₹${payment.amount}.`
        );
      }

      /* ===================================================
         HISTORICAL DURATION
      =================================================== */

      const historicalDuration =
        extractDurationFromNotes(payment.notes);

      const currentDuration = Number(
        plan.durationInDays
      );

      const durationInDays =
        historicalDuration !== null
          ? historicalDuration
          : currentDuration;

      if (
        !Number.isInteger(durationInDays) ||
        durationInDays < 1
      ) {
        throw new Error(
          "Invalid membership plan duration."
        );
      }

      /* ===================================================
         RENEWAL START DATE
      =================================================== */

      const recordedRenewalStart =
        extractRenewalStartFromNotes(payment.notes);

      let renewalStartDate;

      if (recordedRenewalStart) {
        renewalStartDate = new Date(
          recordedRenewalStart
        );
      } else {
        /*
         * Legacy payment fallback.
         *
         * Active membership:
         * renewal starts when current membership ends.
         *
         * Expired membership:
         * renewal starts today.
         */
        const now = new Date();

        const existingEndDate = membership.endDate
          ? new Date(membership.endDate)
          : null;

        if (
          existingEndDate &&
          !Number.isNaN(existingEndDate.getTime()) &&
          existingEndDate > now
        ) {
          renewalStartDate = new Date(
            existingEndDate
          );
        } else {
          renewalStartDate = new Date(now);

          renewalStartDate.setUTCHours(
            0,
            0,
            0,
            0
          );
        }
      }

      if (
        !renewalStartDate ||
        Number.isNaN(renewalStartDate.getTime())
      ) {
        throw new Error(
          "Renewal start date is invalid."
        );
      }

      /* ===================================================
         SAFETY CHECK
      =================================================== */

      const now = new Date();

      const existingEndDate = membership.endDate
        ? new Date(membership.endDate)
        : null;

      if (
        existingEndDate &&
        !Number.isNaN(existingEndDate.getTime()) &&
        existingEndDate > now
      ) {
        /*
         * Active membership:
         * renewal must start exactly at the current
         * membership end date.
         */
        if (
          renewalStartDate.getTime() !==
          existingEndDate.getTime()
        ) {
          throw new Error(
            "Renewal start date does not match the current membership end date."
          );
        }
      } else if (renewalStartDate > now) {
        /*
         * Expired membership cannot start in the future.
         */
        throw new Error(
          "Renewal start date cannot be in the future for an expired membership."
        );
      }

      /* ===================================================
         CALCULATE NEW END DATE
      =================================================== */

      const renewalEndDate = new Date(
        renewalStartDate
      );

      renewalEndDate.setUTCDate(
        renewalEndDate.getUTCDate() +
          durationInDays
      );

      if (renewalEndDate <= renewalStartDate) {
        throw new Error(
          "Calculated renewal end date is invalid."
        );
      }

      /* ===================================================
         UPDATE MEMBERSHIP
      =================================================== */

      membership.plan = plan._id;

      membership.startDate = renewalStartDate;

      membership.endDate = renewalEndDate;

      membership.status = "active";

      membership.priceAtPurchase = planPrice;

      await membership.save({
        session: dbSession,
      });

      /* ===================================================
         UPDATE PAYMENT
      =================================================== */

      payment.status = "paid";

      payment.paidAt = new Date();

      payment.transactionId =
        payment.transactionId ||
        `CASH-RENEWAL-${payment._id.toString()}`;

      payment.membership = membership._id;

      payment.membershipPlan = plan._id;

      payment.membershipStartDate =
        renewalStartDate;

      payment.recordedBy = currentAdmin._id;

      payment.receivedBy = currentAdmin._id;

      await payment.save({
        session: dbSession,
      });

      /* ===================================================
         RESULT
      =================================================== */

      result = {
        alreadyProcessed: false,

        payment: {
          _id: payment._id,
          status: payment.status,
          amount: payment.amount,
          method: payment.method,
          paymentType: payment.paymentType,
          transactionId: payment.transactionId,
          paidAt: payment.paidAt,
          recordedBy: payment.recordedBy,
          receivedBy: payment.receivedBy,
        },

        membership: {
          _id: membership._id,
          status: membership.status,
          startDate: membership.startDate,
          endDate: membership.endDate,
          priceAtPurchase:
            membership.priceAtPurchase,
          membershipType:
            membership.membershipType,
        },

        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },

        plan: {
          _id: plan._id,
          name: plan.name,
          price: planPrice,
          durationInDays,
        },

        renewalStartDate,
        renewalEndDate,
      };
    });

    /* =====================================================
       CLOSE SESSION
    ===================================================== */

    await dbSession.endSession();
    dbSession = null;

    /* =====================================================
       ALREADY PROCESSED
    ===================================================== */

    if (result?.alreadyProcessed) {
      return NextResponse.json(
        {
          success: true,
          message: "Payment was already confirmed.",
          alreadyProcessed: true,

          payment: {
            id: result.payment._id,
            status: result.payment.status,
            amount: result.payment.amount,
            method: result.payment.method,
            paymentType:
              result.payment.paymentType,
            transactionId:
              result.payment.transactionId,
            paidAt: result.payment.paidAt,
            recordedBy:
              result.payment.recordedBy,
            receivedBy:
              result.payment.receivedBy,
          },
        },
        { status: 200 }
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          "Cash renewal payment confirmed successfully.",

        payment: {
          id: result.payment._id,
          status: result.payment.status,
          amount: result.payment.amount,
          method: result.payment.method,
          paymentType:
            result.payment.paymentType,
          transactionId:
            result.payment.transactionId,
          paidAt: result.payment.paidAt,
          recordedBy:
            result.payment.recordedBy,
          receivedBy:
            result.payment.receivedBy,
        },

        membership: {
          id: result.membership._id,
          status: result.membership.status,
          startDate:
            result.membership.startDate,
          endDate:
            result.membership.endDate,
          priceAtPurchase:
            result.membership.priceAtPurchase,

          plan: {
            id: result.plan._id,
            name: result.plan.name,
            price: result.plan.price,
            durationInDays:
              result.plan.durationInDays,
          },
        },

        renewal: {
          startDate:
            result.renewalStartDate,
          endDate:
            result.renewalEndDate,
          durationInDays:
            result.plan.durationInDays,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN CONFIRM CASH RENEWAL ERROR:",
      error
    );

    /* =====================================================
       CLOSE SESSION ON ERROR
    ===================================================== */

    if (dbSession) {
      try {
        await dbSession.endSession();
      } catch (sessionError) {
        console.error(
          "Failed to close MongoDB session:",
          sessionError
        );
      }
    }

    /* =====================================================
       KNOWN ERRORS
    ===================================================== */

    const knownErrors = [
      "Payment not found.",
      "This payment is not a membership renewal.",
      "Only cash renewal payments can be confirmed here.",
      "This payment is no longer pending.",
      "Member account not found.",
      "This payment does not belong to a member account.",
      "This member account is inactive.",
      "No membership is linked to this renewal payment.",
      "Membership not found.",
      "Membership does not belong to this member.",
      "Couple membership renewal requires admin assistance.",
      "No membership plan is linked to this renewal payment.",
      "Membership plan not found.",
      "The selected membership plan is no longer active.",
      "This membership plan is not available for this member.",
      "Invalid membership plan price.",
      "Invalid membership plan duration.",
      "Renewal start date is invalid.",
      "Renewal start date does not match the current membership end date.",
      "Renewal start date cannot be in the future for an expired membership.",
      "Calculated renewal end date is invalid.",
    ];

    if (knownErrors.includes(error?.message)) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (
      error?.message?.startsWith(
        "Payment amount does not match"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to confirm cash renewal payment.",
      },
      { status: 500 }
    );
  }
}