import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import {
  getClientIp,
  paymentRateLimit,
  rateLimitResponse,
} from "@/lib/rateLimit";

import User from "@/models/User";
import Promotion from "@/models/Promotion";
import Membership from "@/models/Membership";
import Payment from "@/models/Payment";

import razorpay from "@/lib/razorpay";

export async function POST(request, { params }) {
  try {
    // ========================================
    // 1. AUTHENTICATION
    // ========================================

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ========================================
    // 2. MEMBER ONLY
    // ========================================

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only members can make purchases.",
        },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user session.",
        },
        { status: 401 }
      );
    }

    // ========================================
    // 3. RATE LIMIT
    // ========================================

    const ip = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        `promotion-razorpay-order:${userId}:${ip}`
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // ========================================
    // 4. GET PROMOTION ID
    // ========================================

    const { id } = await params;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // ========================================
    // 5. GET USER
    // ========================================

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // 6. GET PROMOTION
    // ========================================

    const promotion =
      await Promotion.findOne({
        _id: id,
        isActive: true,
      })
        .populate(
          "membershipPlan",
          "name price durationInDays features"
        )
        .lean();

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promotion not found or inactive.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // 7. VALIDATE PROMOTION TYPE
    // ========================================

    if (
      !["membership", "extension"].includes(
        promotion.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion type.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // 8. CHECK PROMOTION DATES
    // ========================================

    const now = new Date();

    const startDate = new Date(
      promotion.startDate
    );

    const endDate = new Date(
      promotion.endDate
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This promotion has invalid dates.",
        },
        { status: 400 }
      );
    }

    if (now < startDate || now > endDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This promotion is not currently available.",
        },
        { status: 410 }
      );
    }

    // ========================================
    // 9. VALIDATE OFFER PRICE
    // ========================================

    const offerPrice =
      Number(promotion.offerPrice);

    if (
      !Number.isFinite(offerPrice) ||
      offerPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This promotion has an invalid offer price.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // MEMBERSHIP PROMOTION
    // ========================================

    if (promotion.type === "membership") {
      // --------------------------------------
      // Validate membership plan
      // --------------------------------------

      if (!promotion.membershipPlan) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Membership promotion is not configured correctly.",
          },
          { status: 400 }
        );
      }

      // --------------------------------------
      // Check active membership
      // --------------------------------------
      //
      // Check both primary and secondary users
      // because couple memberships use
      // secondaryUser.

      const activeMembership =
        await Membership.findOne({
          $or: [
            { user: user._id },
            { secondaryUser: user._id },
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
            message:
              "You already have an active membership.",
          },
          { status: 400 }
        );
      }

      // --------------------------------------
      // Registration fee
      // --------------------------------------

      let registrationFee = 0;

      if (
        !user.registrationFeePaid &&
        !promotion.registrationFeeWaived
      ) {
        registrationFee = 500;
      }

      // --------------------------------------
      // Final amount
      // --------------------------------------

      const totalAmount =
        offerPrice + registrationFee;

      if (
        !Number.isFinite(totalAmount) ||
        totalAmount < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment amount.",
          },
          { status: 400 }
        );
      }

      const amountInPaise =
        Math.round(totalAmount * 100);

      if (
        !Number.isSafeInteger(amountInPaise) ||
        amountInPaise < 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment amount is invalid.",
          },
          { status: 400 }
        );
      }

      // --------------------------------------
      // Create Razorpay order
      // --------------------------------------

      const order =
        await razorpay.orders.create({
          amount: amountInPaise,

          currency: "INR",

          receipt:
            `promo_${promotion._id}_${Date.now()}`,

          notes: {
            userId: user._id.toString(),

            promotionId:
              promotion._id.toString(),

            promotionType:
              promotion.type,

            offerPrice:
              String(offerPrice),

            registrationFee:
              String(registrationFee),
          },
        });

      // --------------------------------------
      // Create pending payment
      // --------------------------------------

      let payment;

      try {
        payment = await Payment.create({
          user: user._id,

          membership: null,

          membershipPlan:
            promotion.membershipPlan._id,

          promotion: promotion._id,

          paymentType: "promotion",

          amount: totalAmount,

          method: "upi",

          status: "pending",

          gatewayOrderId: order.id,

          transactionId: order.id,

          notes: [
            `Razorpay order for membership promotion: ${promotion.title}`,
            `Promotion offer price: ₹${offerPrice}`,
            `Registration fee: ₹${registrationFee}`,
            `Registration fee waived: ${
              promotion.registrationFeeWaived
                ? "yes"
                : "no"
            }`,
            `Plan price at purchase: ₹${Number(
              promotion.membershipPlan.price
            )}`,
            `Plan duration at purchase: ${Number(
              promotion.membershipPlan.durationInDays
            )} days`,
          ].join(" | "),
        });
      } catch (paymentError) {
        console.error(
          "PROMOTION PAYMENT CREATE ERROR:",
          paymentError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to create the payment record. Please try again.",
          },
          { status: 500 }
        );
      }

      // --------------------------------------
      // Response
      // --------------------------------------

      return NextResponse.json(
        {
          success: true,

          payment: {
            id: payment._id,

            amount: totalAmount,

            method: "upi",

            status: "pending",

            razorpayOrderId:
              order.id,
          },

          razorpay: {
            keyId:
              process.env.RAZORPAY_KEY_ID,

            orderId: order.id,

            amount: order.amount,

            currency: order.currency,
          },

          promotion: {
            id: promotion._id,

            title: promotion.title,

            offerPrice,

            registrationFee,

            totalAmount,

            membershipPlan:
              promotion.membershipPlan,
          },
        },
        { status: 201 }
      );
    }

    // ========================================
    // EXTENSION PROMOTION
    // ========================================

    if (promotion.type === "extension") {
      // --------------------------------------
      // Validate extension days
      // --------------------------------------

      const extensionDays =
        Number(promotion.extensionDays);

      if (
        !Number.isInteger(extensionDays) ||
        extensionDays < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Extension promotion is not configured correctly.",
          },
          { status: 400 }
        );
      }

      // --------------------------------------
      // Find active membership
      // --------------------------------------
      //
      // Check both primary and secondary users
      // for couple memberships.

      const activeMembership =
        await Membership.findOne({
          $or: [
            { user: user._id },
            { secondaryUser: user._id },
          ],

          status: "active",

          endDate: {
            $gte: now,
          },
        });

      if (!activeMembership) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You need an active membership to purchase this extension.",
          },
          { status: 400 }
        );
      }

      // --------------------------------------
      // Validate membership end date
      // --------------------------------------

      const membershipEndDate =
        new Date(activeMembership.endDate);

      if (
        Number.isNaN(
          membershipEndDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your membership has an invalid end date.",
          },
          { status: 500 }
        );
      }

      // --------------------------------------
      // Final amount
      // --------------------------------------

      const totalAmount = offerPrice;

      const amountInPaise =
        Math.round(totalAmount * 100);

      if (
        !Number.isSafeInteger(amountInPaise) ||
        amountInPaise < 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment amount is invalid.",
          },
          { status: 400 }
        );
      }

      // --------------------------------------
      // Create Razorpay order
      // --------------------------------------

      const order =
        await razorpay.orders.create({
          amount: amountInPaise,

          currency: "INR",

          receipt:
            `promo_${promotion._id}_${Date.now()}`,

          notes: {
            userId:
              user._id.toString(),

            promotionId:
              promotion._id.toString(),

            promotionType:
              promotion.type,

            membershipId:
              activeMembership._id.toString(),

            extensionDays:
              String(extensionDays),

            offerPrice:
              String(offerPrice),
          },
        });

      // --------------------------------------
      // Create pending payment
      // --------------------------------------

      let payment;

      try {
        payment = await Payment.create({
          user: user._id,

          membership:
            activeMembership._id,

          promotion:
            promotion._id,

          paymentType: "promotion",

          amount: totalAmount,

          method: "upi",

          status: "pending",

          gatewayOrderId: order.id,

          transactionId: order.id,

          notes: [
            `Razorpay order for extension promotion: ${promotion.title}`,
            `Extension days: ${extensionDays}`,
            `Offer price: ₹${offerPrice}`,
            `Membership end date at purchase: ${membershipEndDate.toISOString()}`,
          ].join(" | "),
        });
      } catch (paymentError) {
        console.error(
          "EXTENSION PAYMENT CREATE ERROR:",
          paymentError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to create the payment record. Please try again.",
          },
          { status: 500 }
        );
      }

      // --------------------------------------
      // Response
      // --------------------------------------

      return NextResponse.json(
        {
          success: true,

          payment: {
            id: payment._id,

            amount: totalAmount,

            method: "upi",

            status: "pending",

            razorpayOrderId:
              order.id,
          },

          razorpay: {
            keyId:
              process.env.RAZORPAY_KEY_ID,

            orderId: order.id,

            amount: order.amount,

            currency: order.currency,
          },

          promotion: {
            id: promotion._id,

            title: promotion.title,

            offerPrice,

            extensionDays,

            totalAmount,
          },

          membership: {
            id: activeMembership._id,

            currentEndDate:
              activeMembership.endDate,
          },
        },
        { status: 201 }
      );
    }

    // ========================================
    // INVALID PROMOTION TYPE
    // ========================================

    return NextResponse.json(
      {
        success: false,
        message: "Invalid promotion type.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "CREATE RAZORPAY PROMOTION ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}