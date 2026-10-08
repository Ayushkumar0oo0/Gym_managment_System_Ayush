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

const REGISTRATION_FEE = 500;

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
    // 2. AUTHORIZATION
    // =========================================================

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only members can purchase memberships.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 3. RATE LIMIT
    // =========================================================

    const clientIp = getClientIp(request);

    const rateLimitIdentifier = createRateLimitIdentifier(
      "payment",
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

    const { planId, method, startDate } = body;

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

    if (typeof planId !== "string" || !planId.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan is required.",
        },
        { status: 400 }
      );
    }

    const cleanPlanId = planId.trim();

    if (!mongoose.isValidObjectId(cleanPlanId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid membership plan.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 7. VALIDATE START DATE
    // =========================================================

    if (!startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership start date is required.",
        },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid membership start date.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Normalize membership start date to midnight.
    //
    // This keeps membership dates consistent between:
    // - member purchase
    // - admin confirmation
    // - membership status
    // - renewal
    // ---------------------------------------------------------

    const membershipStartDate = new Date(parsedStartDate);

    membershipStartDate.setHours(0, 0, 0, 0);

    // =========================================================
    // 8. PREVENT PAST START DATE
    // =========================================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (membershipStartDate < today) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership start date cannot be in the past.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 9. DATABASE
    // =========================================================

    await connectDB();

    // =========================================================
    // 10. FIND USER
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
    // 11. VERIFY USER IS ACTIVE
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
    // 12. CHECK CURRENT MEMBERSHIP
    //
    // Check both:
    // - primary member
    // - secondary/couple member
    //
    // This prevents a secondary couple member from purchasing
    // another individual membership while the couple membership
    // is still active.
    // =========================================================

    const now = new Date();

    const activeMembership = await Membership.findOne({
      $or: [
        {
          user: user._id,
        },
        {
          secondaryUser: user._id,
        },
      ],
      status: "active",
      endDate: {
        $gte: now,
      },
    }).lean();

    if (activeMembership) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an active membership.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 13. FIND MEMBERSHIP PLAN
    // =========================================================

    const plan = await MembershipPlan.findById(cleanPlanId).lean();

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
    // 14. CHECK PLAN STATUS
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
    // 15. CHECK PLAN ELIGIBILITY
    // =========================================================

    if (
      plan.eligibility !== "both" &&
      plan.eligibility !== user.gender
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not eligible for this membership plan.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 16. VALIDATE PLAN PRICE
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
    // 17. VALIDATE PLAN DURATION
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
    // 18. REGISTRATION FEE
    //
    // Registration fee is charged only when:
    //
    // 1. It has not already been paid
    // 2. It has not been waived
    //
    // Otherwise registration fee = ₹0.
    // =========================================================

    const registrationFee =
      user.registrationFeePaid === true ||
      user.registrationFeeWaived === true
        ? 0
        : REGISTRATION_FEE;

    // =========================================================
    // 19. TOTAL AMOUNT
    // =========================================================

    const totalAmount = planPrice + registrationFee;

    // =========================================================
    // 20. PREVENT DUPLICATE PENDING PAYMENT
    //
    // We intentionally check by:
    // - user
    // - plan
    // - payment type
    // - payment method
    // - normalized start date
    //
    // This prevents accidental duplicate requests from creating
    // multiple pending payments for the exact same purchase.
    // =========================================================

    const existingPendingPayment = await Payment.findOne({
      user: user._id,
      membershipPlan: plan._id,
      paymentType: "membership",
      method,
      status: "pending",
      membershipStartDate,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    if (existingPendingPayment) {
      return NextResponse.json(
        {
          success: true,
          message:
            "You already have a pending payment for this membership.",

          payment: {
            id: existingPendingPayment._id,

            amount: existingPendingPayment.amount,

            method: existingPendingPayment.method,

            status: existingPendingPayment.status,

            paymentType: existingPendingPayment.paymentType,
          },

          membership: {
            planId: plan._id,

            planName: plan.name,

            planPrice,

            durationInDays,

            registrationFee,

            totalAmount: existingPendingPayment.amount,

            startDate: existingPendingPayment.membershipStartDate,
          },
        },
        { status: 200 }
      );
    }

    // =========================================================
    // 21. CREATE PAYMENT
    // =========================================================

    const payment = await Payment.create({
      user: user._id,

      membership: null,

      membershipPlan: plan._id,

      membershipStartDate,

      promotion: null,

      paymentType: "membership",

      amount: totalAmount,

      method,

      status: "pending",

      notes:
        `Membership purchase: ${plan.name}` +
        ` | Plan price: ₹${planPrice}` +
        ` | Duration: ${durationInDays} days` +
        ` | Registration fee: ₹${registrationFee}` +
        ` | Start date: ${membershipStartDate.toISOString()}` +
        (
          registrationFee === 0
            ? user.registrationFeeWaived === true
              ? " (waived)"
              : " (already paid)"
            : " (pending)"
        ),
    });

    // =========================================================
    // 22. RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          method === "cash"
            ? "Cash payment request created. Please pay at the gym and wait for admin confirmation."
            : "Payment created successfully. Continue with Razorpay.",

        payment: {
          id: payment._id,

          amount: payment.amount,

          method: payment.method,

          status: payment.status,

          paymentType: payment.paymentType,
        },

        membership: {
          planId: plan._id,

          planName: plan.name,

          planPrice,

          durationInDays,

          registrationFee,

          registrationFeeWaived:
            user.registrationFeeWaived === true,

          totalAmount,

          startDate: membershipStartDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "MEMBERSHIP PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to create membership payment.",
      },
      { status: 500 }
    );
  }
}