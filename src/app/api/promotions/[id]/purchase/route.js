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

export async function POST(request, { params }) {
  try {
    // -----------------------------------
    // 1. CHECK LOGIN
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
            "Only members can purchase promotions.",
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
        `promotion-purchase:${userId}:${ip}`
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // -----------------------------------
    // 3. GET PROMOTION ID
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

    await connectDB();

    // -----------------------------------
    // 4. FIND PROMOTION
    // -----------------------------------

    const promotion = await Promotion.findOne({
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

    // -----------------------------------
    // 5. CHECK PROMOTION TYPE
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
    // 6. CHECK PROMOTION DATES
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
    // 7. VALIDATE OFFER PRICE
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
    // 8. GET USER
    // -----------------------------------

    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // ===================================
    // MEMBERSHIP PROMOTION
    // ===================================

    if (promotion.type === "membership") {
      // ---------------------------------
      // Validate membership plan
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

      // ---------------------------------
      // Calculate registration fee
      // ---------------------------------

      let registrationFee = 0;

      if (
        !user.registrationFeePaid &&
        !promotion.registrationFeeWaived
      ) {
        registrationFee = 500;
      }

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
              "Invalid total payment amount.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------
      // Return purchase information
      // ---------------------------------

      return NextResponse.json(
        {
          success: true,

          purchaseType: "membership",

          message:
            "Membership promotion is ready for payment.",

          promotion: {
            id: promotion._id,
            title: promotion.title,
            description: promotion.description,
            posterImage: promotion.posterImage,

            offerPrice,

            registrationFee,

            totalAmount,

            registrationFeeWaived:
              Boolean(
                promotion.registrationFeeWaived
              ),

            membershipPlan:
              promotion.membershipPlan,

            startDate:
              promotion.startDate,

            endDate:
              promotion.endDate,
          },

          paymentRequired: true,
        },
        { status: 200 }
      );
    }

    // ===================================
    // EXTENSION PROMOTION
    // ===================================

    if (promotion.type === "extension") {
      // ---------------------------------
      // Validate extension days
      // ---------------------------------

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

      // ---------------------------------
      // Find active membership
      // ---------------------------------
      //
      // A member can be:
      //
      // 1. Primary member
      // 2. Secondary member of a couple
      //
      // Check both.

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
        })
          .populate(
            "plan",
            "name price durationInDays features"
          )
          .lean();

      if (!activeMembership) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You need an active membership to purchase this extension offer.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------
      // Validate current end date
      // ---------------------------------

      const oldEndDate =
        new Date(activeMembership.endDate);

      if (
        Number.isNaN(oldEndDate.getTime())
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
      // Calculate new end date
      // ---------------------------------

      const newEndDate =
        new Date(oldEndDate);

      newEndDate.setDate(
        newEndDate.getDate() +
          extensionDays
      );

      // ---------------------------------
      // Return purchase information
      // ---------------------------------

      return NextResponse.json(
        {
          success: true,

          purchaseType: "extension",

          message:
            "Membership extension is ready for payment.",

          promotion: {
            id: promotion._id,

            title: promotion.title,

            description:
              promotion.description,

            posterImage:
              promotion.posterImage,

            offerPrice,

            extensionDays,

            startDate:
              promotion.startDate,

            endDate:
              promotion.endDate,
          },

          membership: {
            id: activeMembership._id,

            plan: activeMembership.plan,

            oldEndDate,

            newEndDate,
          },

          pricing: {
            totalAmount: offerPrice,
          },

          paymentRequired: true,
        },
        { status: 200 }
      );
    }

    // -----------------------------------
    // INVALID PROMOTION TYPE
    // -----------------------------------

    return NextResponse.json(
      {
        success: false,
        message: "Invalid promotion type.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "PROMOTION PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create promotion purchase.",
      },
      { status: 500 }
    );
  }
}