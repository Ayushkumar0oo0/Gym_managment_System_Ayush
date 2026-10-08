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

const REGISTRATION_FEE = 500;

export async function POST(request, { params }) {
  try {
    // -----------------------------------
    // 1. AUTHENTICATION
    // -----------------------------------

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

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only members can make promotion purchases.",
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

    // -----------------------------------
    // 2. RATE LIMIT
    // -----------------------------------

    const ip = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        `promotion-payment:${userId}:${ip}`
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // -----------------------------------
    // 3. PROMOTION ID
    // -----------------------------------

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

    // -----------------------------------
    // 4. REQUEST BODY
    // -----------------------------------

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

    /*
     * IMPORTANT:
     *
     * Members should not be able to create a
     * cash payment themselves.
     *
     * Cash payments must be recorded/confirmed
     * through the admin payment flow.
     */
    const { method } = body || {};

    if (method !== "upi") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Online promotion payments must use UPI.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 5. DATABASE
    // -----------------------------------

    await connectDB();

    // -----------------------------------
    // 6. USER
    // -----------------------------------

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

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------
    // 7. PROMOTION
    // -----------------------------------

    const promotion =
      await Promotion.findOne({
        _id: id,
        isActive: true,
      })
        .populate(
          "membershipPlan",
          "name price durationInDays features eligibility isActive"
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

    // -----------------------------------
    // 8. PROMOTION TYPE
    // -----------------------------------

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

    // -----------------------------------
    // 9. PROMOTION DATES
    // -----------------------------------

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

    if (endDate < startDate) {
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

    // -----------------------------------
    // 10. OFFER PRICE
    // -----------------------------------

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

    // -----------------------------------
    // 11. MEMBERSHIP PROMOTION
    // -----------------------------------

    if (promotion.type === "membership") {
      // ---------------------------------
      // Validate plan
      // ---------------------------------

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

      if (!promotion.membershipPlan.isActive) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The membership plan is no longer active.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------
      // Gender eligibility
      // ---------------------------------

      const eligibility =
        promotion.membershipPlan.eligibility;

      if (
        eligibility &&
        eligibility !== "both" &&
        eligibility !== user.gender
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You are not eligible for this membership plan.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------
      // Prevent active membership
      // ---------------------------------

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

      // ---------------------------------
      // Registration fee
      // ---------------------------------

      let registrationFee = 0;

      if (
        !user.registrationFeePaid &&
        !promotion.registrationFeeWaived
      ) {
        registrationFee = REGISTRATION_FEE;
      }

      // ---------------------------------
      // Final amount
      // ---------------------------------

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

      // ---------------------------------
      // Create pending payment
      // ---------------------------------

      const payment =
        await Payment.create({
          user: user._id,

          membership: null,

          membershipPlan:
            promotion.membershipPlan._id,

          promotion: promotion._id,

          paymentType: "promotion",

          amount: totalAmount,

          method: "upi",

          status: "pending",

          notes: [
            `Membership promotion: ${promotion.title}`,
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

      return NextResponse.json(
        {
          success: true,

          message:
            "Payment created successfully.",

          payment: {
            id: payment._id,
            amount: totalAmount,
            method: "upi",
            status: payment.status,
            paymentType:
              payment.paymentType,
            promotion:
              payment.promotion,
          },

          promotion: {
            id: promotion._id,
            type: promotion.type,
            title: promotion.title,
            offerPrice,
            registrationFee,
            totalAmount,
            membershipPlan:
              promotion.membershipPlan,
            registrationFeeWaived:
              Boolean(
                promotion.registrationFeeWaived
              ),
          },
        },
        { status: 201 }
      );
    }

    // -----------------------------------
    // 12. EXTENSION PROMOTION
    // -----------------------------------

    if (promotion.type === "extension") {
      const extensionDays =
        Number(promotion.extensionDays);

      if (
        !Number.isInteger(extensionDays) ||
        extensionDays < 1 ||
        extensionDays > 3650
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

      // ---------------------------------
      // Find active membership
      // ---------------------------------

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

      // ---------------------------------
      // Validate end date
      // ---------------------------------

      const membershipEndDate =
        new Date(
          activeMembership.endDate
        );

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

      // ---------------------------------
      // Create pending payment
      // ---------------------------------

      const payment =
        await Payment.create({
          user: user._id,

          membership:
            activeMembership._id,

          promotion: promotion._id,

          paymentType: "promotion",

          amount: offerPrice,

          method: "upi",

          status: "pending",

          notes: [
            `Membership extension promotion: ${promotion.title}`,
            `Extension days: ${extensionDays}`,
            `Offer price: ₹${offerPrice}`,
            `Membership end date at purchase: ${membershipEndDate.toISOString()}`,
          ].join(" | "),
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Payment created successfully.",

          payment: {
            id: payment._id,
            amount: offerPrice,
            method: "upi",
            status: payment.status,
            paymentType:
              payment.paymentType,
            promotion:
              payment.promotion,
            membership:
              payment.membership,
          },

          promotion: {
            id: promotion._id,
            type: promotion.type,
            title: promotion.title,
            offerPrice,
            extensionDays,
          },

          membership: {
            id: activeMembership._id,
            oldEndDate:
              activeMembership.endDate,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid promotion type.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "CREATE PROMOTION PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create payment.",
      },
      { status: 500 }
    );
  }
}