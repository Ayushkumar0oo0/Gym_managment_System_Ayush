import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Payment from "@/models/Payment";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";

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
          message: "Only members can create membership payments.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 3. RATE LIMIT
    // =========================================================

    const clientIp = getClientIp(request);

    const rateLimitIdentifier = createRateLimitIdentifier(
      "membership-razorpay",
      `${session.user.id}:${clientIp}`
    );

    const rateLimitResult = await paymentRateLimit.limit(
      rateLimitIdentifier
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // =========================================================
    // 4. RAZORPAY CREDENTIALS
    // =========================================================

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials are missing.");

      return NextResponse.json(
        {
          success: false,
          message: "Payment service is not configured correctly.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 5. READ REQUEST BODY
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

    const { paymentId } = body || {};

    // =========================================================
    // 6. VALIDATE PAYMENT ID
    // =========================================================

    if (
      typeof paymentId !== "string" ||
      !paymentId.trim() ||
      !mongoose.isValidObjectId(paymentId.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid payment ID is required.",
        },
        { status: 400 }
      );
    }

    const cleanPaymentId = paymentId.trim();

    // =========================================================
    // 7. DATABASE
    // =========================================================

    await connectDB();

    // =========================================================
    // 8. FIND PAYMENT
    // =========================================================

    const payment = await Payment.findById(cleanPaymentId).populate(
      "membershipPlan",
      "name price durationInDays eligibility isActive"
    );

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 9. OWNERSHIP CHECK
    // =========================================================

    if (
      !payment.user ||
      payment.user.toString() !== session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to process this payment.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 10. PAYMENT TYPE
    //
    // Supported:
    // - membership = new membership purchase
    // - renewal    = existing membership renewal
    // =========================================================

    if (
      payment.paymentType !== "membership" &&
      payment.paymentType !== "renewal"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This payment cannot be processed through Razorpay.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 11. PAYMENT METHOD
    // =========================================================

    if (payment.method !== "upi") {
      return NextResponse.json(
        {
          success: false,
          message: "Only UPI payments can be processed through Razorpay.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 12. PAYMENT STATUS
    // =========================================================

    if (payment.status === "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "This payment has already been completed.",
        },
        { status: 400 }
      );
    }

    if (payment.status === "refunded") {
      return NextResponse.json(
        {
          success: false,
          message: "A refunded payment cannot be processed.",
        },
        { status: 400 }
      );
    }

    if (payment.status === "failed") {
      return NextResponse.json(
        {
          success: false,
          message: "This payment has failed. Please create a new payment.",
        },
        { status: 400 }
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "This payment cannot be processed in its current state.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 13. USER
    // =========================================================

    const user = await User.findById(session.user.id).select(
      "name email phone gender isActive"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 14. MEMBERSHIP-SPECIFIC VALIDATION
    // =========================================================

    let membership = null;

    if (payment.paymentType === "renewal") {
      // -------------------------------------------------------
      // RENEWAL
      // -------------------------------------------------------

      if (!payment.membership) {
        return NextResponse.json(
          {
            success: false,
            message: "Membership information is missing from this renewal.",
          },
          { status: 400 }
        );
      }

      membership = await Membership.findById(payment.membership);

      if (!membership) {
        return NextResponse.json(
          {
            success: false,
            message: "Membership not found.",
          },
          { status: 404 }
        );
      }

      const isPrimaryMember =
        membership.user &&
        membership.user.toString() === session.user.id;

      const isSecondaryMember =
        membership.secondaryUser &&
        membership.secondaryUser.toString() === session.user.id;

      if (!isPrimaryMember && !isSecondaryMember) {
        return NextResponse.json(
          {
            success: false,
            message: "This membership does not belong to you.",
          },
          { status: 403 }
        );
      }

      if (
        membership.membershipType === "couple" ||
        membership.secondaryUser
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Couple membership renewals require admin assistance.",
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 15. MEMBERSHIP PLAN
    // =========================================================

    if (!payment.membershipPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan is missing from this payment.",
        },
        { status: 400 }
      );
    }

    const plan = await MembershipPlan.findById(
      payment.membershipPlan._id || payment.membershipPlan
    );

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
    // 16. PLAN MUST BE ACTIVE
    // =========================================================

    if (!plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected membership plan is no longer active.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 17. GENDER ELIGIBILITY
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
    // 18. PAYMENT AMOUNT
    // =========================================================

    const paymentAmount = Number(payment.amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount is invalid.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 19. REUSE EXISTING RAZORPAY ORDER
    // =========================================================

    if (payment.gatewayOrderId) {
      return NextResponse.json(
        {
          success: true,
          message: "Razorpay order already exists.",

          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status,
            paymentType: payment.paymentType,
          },

          membership: membership
            ? {
                id: membership._id,
                planId: plan._id,
                planName: plan.name,
                durationInDays: plan.durationInDays,
              }
            : {
                id: null,
                planId: plan._id,
                planName: plan.name,
                durationInDays: plan.durationInDays,
              },

          razorpay: {
            key: razorpayKeyId,
            orderId: payment.gatewayOrderId,
            amount: Math.round(paymentAmount * 100),
            currency: "INR",
          },
        },
        { status: 200 }
      );
    }

    // =========================================================
    // 20. CREATE RAZORPAY CLIENT
    // =========================================================

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // =========================================================
    // 21. INR → PAISE
    // =========================================================

    const amountInPaise = Math.round(paymentAmount * 100);

    if (
      !Number.isSafeInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount is invalid.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 22. RAZORPAY ORDER METADATA
    // =========================================================

    const isRenewal = payment.paymentType === "renewal";

    const receiptPrefix = isRenewal
      ? "renewal"
      : "membership";

    const razorpayNotes = {
      paymentId: payment._id.toString(),
      userId: session.user.id,
      paymentType: payment.paymentType,
      membershipPlan: plan._id.toString(),
    };

    if (membership) {
      razorpayNotes.membershipId = membership._id.toString();
    }

    // =========================================================
    // 23. CREATE RAZORPAY ORDER
    // =========================================================

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",

      receipt: `${receiptPrefix}_${payment._id}`,

      notes: razorpayNotes,
    });

    // =========================================================
    // 24. VALIDATE RAZORPAY RESPONSE
    // =========================================================

    if (
      !razorpayOrder ||
      typeof razorpayOrder.id !== "string" ||
      !razorpayOrder.id.length
    ) {
      console.error(
        "Invalid Razorpay order response:",
        razorpayOrder
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to create Razorpay order.",
        },
        { status: 502 }
      );
    }

    // =========================================================
    // 25. SAVE GATEWAY ORDER ID
    // =========================================================

    const updatedPayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: "pending",
        gatewayOrderId: null,
      },
      {
        $set: {
          gatewayOrderId: razorpayOrder.id,
        },
      },
      {
        new: true,
      }
    );

    // =========================================================
    // 26. HANDLE CONCURRENT REQUEST
    // =========================================================

    if (!updatedPayment) {
      const latestPayment = await Payment.findById(
        payment._id
      );

      if (latestPayment?.gatewayOrderId) {
        return NextResponse.json(
          {
            success: true,
            message: "Razorpay order already exists.",

            payment: {
              id: latestPayment._id,
              amount: latestPayment.amount,
              status: latestPayment.status,
              paymentType: latestPayment.paymentType,
            },

            membership: {
              id: membership?._id || null,
              planId: plan._id,
              planName: plan.name,
              durationInDays: plan.durationInDays,
            },

            razorpay: {
              key: razorpayKeyId,
              orderId: latestPayment.gatewayOrderId,
              amount: Math.round(
                Number(latestPayment.amount) * 100
              ),
              currency: "INR",
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to save Razorpay order. Please try again.",
        },
        { status: 409 }
      );
    }

    // =========================================================
    // 27. SUCCESS
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        message: isRenewal
          ? "Razorpay renewal order created successfully."
          : "Razorpay membership order created successfully.",

        payment: {
          id: updatedPayment._id,
          amount: updatedPayment.amount,
          status: updatedPayment.status,
          paymentType: updatedPayment.paymentType,
        },

        membership: {
          id: membership?._id || null,
          planId: plan._id,
          planName: plan.name,
          durationInDays: plan.durationInDays,
        },

        razorpay: {
          key: razorpayKeyId,
          orderId: razorpayOrder.id,
          amount: amountInPaise,
          currency: "INR",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBERSHIP RAZORPAY ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}