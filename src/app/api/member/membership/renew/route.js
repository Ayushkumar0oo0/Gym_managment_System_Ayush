import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import Payment from "@/models/Payment";

import {
  paymentRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(request) {
  try {
    // =========================================================
    // 1. AUTHENTICATION
    // =========================================================

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

    // =========================================================
    // 2. ROLE CHECK
    // =========================================================

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only members can renew memberships.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 3. RATE LIMIT
    // =========================================================

    const clientIp = getClientIp(request);

    const rateLimitIdentifier = createRateLimitIdentifier(
      "membership-renew",
      `${session.user.id}:${clientIp}`
    );

    const rateLimitResult = await paymentRateLimit.limit(
      rateLimitIdentifier
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // =========================================================
    // 4. READ REQUEST BODY
    // =========================================================

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const { planId, method } = body;

    // =========================================================
    // 5. VALIDATE PAYMENT METHOD
    // =========================================================

    if (!["upi", "cash"].includes(method)) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment method must be UPI or cash.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 6. VALIDATE PLAN ID
    // =========================================================

    if (
      typeof planId !== "string" ||
      !planId.trim() ||
      !mongoose.isValidObjectId(planId.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid membership plan is required.",
        },
        { status: 400 }
      );
    }

    const cleanPlanId = planId.trim();

    // =========================================================
    // 7. DATABASE CONNECTION
    // =========================================================

    await connectDB();

    // =========================================================
    // 8. FIND USER
    // =========================================================

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 9. USER STATUS
    // =========================================================

    if (user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 10. FIND CURRENT MEMBERSHIP
    // =========================================================

    const currentMembership = await Membership.findOne({
      $or: [
        {
          user: user._id,
        },
        {
          secondaryUser: user._id,
        },
      ],
      status: {
        $in: ["active", "expired"],
      },
    }).sort({
      endDate: -1,
      createdAt: -1,
    });

    if (!currentMembership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have an existing membership to renew.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 11. BLOCK COUPLE MEMBERSHIP RENEWAL
    // =========================================================

    if (
      currentMembership.membershipType === "couple" ||
      currentMembership.secondaryUser
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Couple memberships cannot be renewed online. Please contact the gym admin.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 12. FIND MEMBERSHIP PLAN
    // =========================================================

    const plan = await MembershipPlan.findById(cleanPlanId);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 13. PLAN STATUS
    // =========================================================

    if (plan.isActive !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "This membership plan is no longer active.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 14. PLAN ELIGIBILITY
    // =========================================================

    if (
      plan.eligibility !== "both" &&
      plan.eligibility !== user.gender
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not eligible for the selected membership plan.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 15. VALIDATE PLAN PRICE
    // =========================================================

    const planPrice = Number(plan.price);

    if (!Number.isFinite(planPrice) || planPrice < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan has an invalid price.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 16. VALIDATE PLAN DURATION
    // =========================================================

    const durationInDays = Number(plan.durationInDays);

    if (
      !Number.isInteger(durationInDays) ||
      durationInDays < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan has an invalid duration.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 17. CHECK EXISTING PENDING RENEWAL
    //
    // IMPORTANT:
    // If the member previously opened Razorpay and closed it,
    // the payment remains pending.
    //
    // We REUSE that payment instead of creating a duplicate.
    //
    // If the member now chooses CASH, we change the pending
    // payment method from UPI -> CASH.
    // =========================================================

    const existingPendingPayment =
      await Payment.findOne({
        user: user._id,
        paymentType: "renewal",
        status: "pending",
      })
        .populate(
          "membershipPlan",
          "name price durationInDays features eligibility"
        )
        .sort({
          createdAt: -1,
        });

    if (existingPendingPayment) {
      const existingPlanId =
        existingPendingPayment.membershipPlan?._id?.toString() ||
        existingPendingPayment.membershipPlan?.toString() ||
        null;

      const requestedPlanId = plan._id.toString();

      // -------------------------------------------------------
      // Same pending payment + same plan
      // -------------------------------------------------------

      if (existingPlanId === requestedPlanId) {
        // -----------------------------------------------------
        // User switched from UPI to CASH
        // -----------------------------------------------------

        if (
          existingPendingPayment.method === "upi" &&
          method === "cash"
        ) {
          existingPendingPayment.method = "cash";

          // A Razorpay order may already have been created.
          // Since the user is now choosing cash, clear the
          // gateway information so this payment is no longer
          // treated as a Razorpay payment.
          existingPendingPayment.gatewayOrderId = null;
          existingPendingPayment.gatewayPaymentId = null;
          existingPendingPayment.transactionId = null;

          existingPendingPayment.notes =
            `${existingPendingPayment.notes || ""}` +
            " | Payment method changed from UPI to cash after Razorpay checkout was closed.";

          await existingPendingPayment.save();

          return NextResponse.json(
            {
              success: true,
              reusedExistingPayment: true,
              message:
                "Your pending renewal has been switched to cash payment. Please pay at the gym and wait for admin confirmation.",
              payment: {
                id: existingPendingPayment._id,
                amount: existingPendingPayment.amount,
                method: existingPendingPayment.method,
                status: existingPendingPayment.status,
                paymentType:
                  existingPendingPayment.paymentType,
                createdAt:
                  existingPendingPayment.createdAt,
              },
              renewal: {
                membershipId:
                  currentMembership._id,
                planId: plan._id,
                planName: plan.name,
                planPrice,
                durationInDays,
                currentEndDate:
                  currentMembership.endDate,
                startDate:
                  existingPendingPayment.membershipStartDate,
              },
            },
            { status: 200 }
          );
        }

        // -----------------------------------------------------
        // User wants UPI again
        //
        // Reuse the same pending payment.
        // The Razorpay route can create/open the payment
        // checkout again.
        // -----------------------------------------------------

        if (
          existingPendingPayment.method === "upi" &&
          method === "upi"
        ) {
          return NextResponse.json(
            {
              success: true,
              reusedExistingPayment: true,
              message:
                "Your existing renewal payment is ready. Continue with Razorpay.",
              payment: {
                id: existingPendingPayment._id,
                amount: existingPendingPayment.amount,
                method: existingPendingPayment.method,
                status: existingPendingPayment.status,
                paymentType:
                  existingPendingPayment.paymentType,
                createdAt:
                  existingPendingPayment.createdAt,
              },
              renewal: {
                membershipId:
                  currentMembership._id,
                planId: existingPlanId,
                planName:
                  existingPendingPayment.membershipPlan?.name ||
                  plan.name,
                planPrice,
                durationInDays,
                currentEndDate:
                  currentMembership.endDate,
                startDate:
                  existingPendingPayment.membershipStartDate,
              },
            },
            { status: 200 }
          );
        }

        // -----------------------------------------------------
        // Existing payment is already CASH
        // -----------------------------------------------------

        if (
          existingPendingPayment.method === "cash" &&
          method === "cash"
        ) {
          return NextResponse.json(
            {
              success: true,
              reusedExistingPayment: true,
              message:
                "Your cash renewal request is already pending. Please pay at the gym and wait for admin confirmation.",
              payment: {
                id: existingPendingPayment._id,
                amount: existingPendingPayment.amount,
                method: existingPendingPayment.method,
                status: existingPendingPayment.status,
                paymentType:
                  existingPendingPayment.paymentType,
                createdAt:
                  existingPendingPayment.createdAt,
              },
              renewal: {
                membershipId:
                  currentMembership._id,
                planId: existingPlanId,
                planName:
                  existingPendingPayment.membershipPlan?.name ||
                  plan.name,
                planPrice,
                durationInDays,
                currentEndDate:
                  currentMembership.endDate,
                startDate:
                  existingPendingPayment.membershipStartDate,
              },
            },
            { status: 200 }
          );
        }
      }

      // -------------------------------------------------------
      // Existing pending payment belongs to another plan.
      //
      // Do NOT silently create another renewal.
      // The member should finish the existing renewal first.
      // -------------------------------------------------------

      return NextResponse.json(
        {
          success: false,
          message:
            "You already have a pending membership renewal for another plan. Please complete it or wait for the gym admin to confirm it.",
          payment: {
            id: existingPendingPayment._id,
            amount: existingPendingPayment.amount,
            method: existingPendingPayment.method,
            status: existingPendingPayment.status,
            paymentType:
              existingPendingPayment.paymentType,
            createdAt:
              existingPendingPayment.createdAt,
          },
          renewal: {
            membershipId:
              existingPendingPayment.membership,
            planId: existingPlanId,
            planName:
              existingPendingPayment.membershipPlan?.name ||
              null,
          },
        },
        { status: 409 }
      );
    }

    // =========================================================
    // 18. CALCULATE RENEWAL START DATE
    //
    // ACTIVE:
    // New membership starts after current membership ends.
    //
    // EXPIRED:
    // New membership starts today.
    // =========================================================

    const now = new Date();

    const currentEndDate = currentMembership.endDate
      ? new Date(currentMembership.endDate)
      : null;

    const membershipIsCurrentlyActive =
      currentEndDate && currentEndDate > now;

    let renewalStartDate;

    if (membershipIsCurrentlyActive) {
      renewalStartDate = new Date(currentEndDate);
    } else {
      renewalStartDate = new Date(now);
    }

    renewalStartDate.setHours(0, 0, 0, 0);

    // =========================================================
    // 19. CALCULATE EXPECTED END DATE
    // =========================================================

    const renewalEndDate = new Date(
      renewalStartDate
    );

    renewalEndDate.setDate(
      renewalEndDate.getDate() + durationInDays
    );

    // =========================================================
    // 20. CREATE RENEWAL PAYMENT
    // =========================================================

    const payment = await Payment.create({
      user: user._id,

      membership: currentMembership._id,

      membershipPlan: plan._id,

      membershipStartDate: renewalStartDate,

      promotion: null,

      paymentType: "renewal",

      amount: planPrice,

      method,

      status: "pending",

      notes:
        `Membership renewal: ${plan.name}` +
        ` | Plan price: ₹${planPrice}` +
        ` | Duration: ${durationInDays} days` +
        ` | Renewal start: ${renewalStartDate.toISOString()}` +
        ` | Renewal end: ${renewalEndDate.toISOString()}`,
    });

    // =========================================================
    // 21. RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,
        reusedExistingPayment: false,

        message:
          method === "cash"
            ? "Cash renewal request created. Please pay at the gym and wait for admin confirmation."
            : "Renewal payment created successfully. Continue with Razorpay.",

        payment: {
          id: payment._id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          paymentType: payment.paymentType,
        },

        renewal: {
          membershipId: currentMembership._id,

          planId: plan._id,

          planName: plan.name,

          planPrice,

          durationInDays,

          currentEndDate:
            currentMembership.endDate,

          startDate: renewalStartDate,

          endDate: renewalEndDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "MEMBERSHIP RENEWAL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create membership renewal payment.",
      },
      { status: 500 }
    );
  }
}