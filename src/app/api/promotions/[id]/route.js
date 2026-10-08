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

export async function GET(request, { params }) {
  try {
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
          message: "Only members can purchase promotions.",
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

    const ip = getClientIp(request);

    const rateLimitKey = `promotion-eligibility:${userId}:${ip}`;

    const rateLimitResult =
      await paymentRateLimit.limit(rateLimitKey);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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
    // Find promotion
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
          message: "Promotion not found or inactive.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------
    // Check promotion dates
    // -----------------------------------

    const now = new Date();

    if (
      now < new Date(promotion.startDate) ||
      now > new Date(promotion.endDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This promotion is not currently available.",
        },
        { status: 410 }
      );
    }

    // -----------------------------------
    // Get current user
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
      if (!promotion.membershipPlan) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This membership promotion is not configured correctly.",
          },
          { status: 400 }
        );
      }

      /*
       * Registration fee rules:
       *
       * Already paid
       *      -> ₹0
       *
       * Promotion says FREE
       *      -> ₹0
       *
       * Otherwise
       *      -> ₹500
       */

      let registrationFee = 0;

      if (
        !user.registrationFeePaid &&
        !promotion.registrationFeeWaived
      ) {
        registrationFee = 500;
      }

      const offerPrice = Number(promotion.offerPrice);

      if (!Number.isFinite(offerPrice) || offerPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This promotion has an invalid offer price.",
          },
          { status: 400 }
        );
      }

      const totalAmount =
        offerPrice + registrationFee;

      return NextResponse.json({
        success: true,

        eligible: true,

        promotionType: "membership",

        promotion: {
          id: promotion._id,
          title: promotion.title,
          description: promotion.description,
          posterImage: promotion.posterImage,
          offerPrice,

          registrationFeeWaived:
            Boolean(promotion.registrationFeeWaived),

          membershipPlan:
            promotion.membershipPlan,

          startDate: promotion.startDate,
          endDate: promotion.endDate,
        },

        registration: {
          alreadyPaid:
            Boolean(user.registrationFeePaid),

          fee: registrationFee,
        },

        pricing: {
          membershipOfferPrice: offerPrice,
          registrationFee,
          totalAmount,
        },
      });
    }

    // ===================================
    // EXTENSION PROMOTION
    // ===================================

    if (promotion.type === "extension") {
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
              "This extension promotion is not configured correctly.",
          },
          { status: 400 }
        );
      }

      const offerPrice =
        Number(promotion.offerPrice);

      if (!Number.isFinite(offerPrice) || offerPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This promotion has an invalid offer price.",
          },
          { status: 400 }
        );
      }

      /*
       * A member can be:
       *
       * 1. The primary user of a membership
       * 2. The secondary user of a couple membership
       *
       * Therefore we must check both fields.
       */

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
        return NextResponse.json({
          success: true,

          eligible: false,

          promotionType: "extension",

          message:
            "You need an active membership to use this extension offer.",

          promotion: {
            id: promotion._id,
            title: promotion.title,
            description: promotion.description,
            posterImage: promotion.posterImage,
            offerPrice,
            extensionDays,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
          },
        });
      }

      const currentEndDate =
        new Date(activeMembership.endDate);

      if (Number.isNaN(currentEndDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The current membership has an invalid end date.",
          },
          { status: 500 }
        );
      }

      const newEndDate =
        new Date(currentEndDate);

      newEndDate.setDate(
        newEndDate.getDate() + extensionDays
      );

      return NextResponse.json({
        success: true,

        eligible: true,

        promotionType: "extension",

        promotion: {
          id: promotion._id,
          title: promotion.title,
          description: promotion.description,
          posterImage: promotion.posterImage,
          offerPrice,
          extensionDays,
          startDate: promotion.startDate,
          endDate: promotion.endDate,
        },

        membership: {
          id: activeMembership._id,

          plan: activeMembership.plan,

          currentEndDate:
            activeMembership.endDate,

          newEndDate,

          daysToAdd: extensionDays,
        },

        pricing: {
          totalAmount: offerPrice,
        },
      });
    }

    // ===================================
    // INVALID PROMOTION TYPE
    // ===================================

    return NextResponse.json(
      {
        success: false,
        message: "Invalid promotion type.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "PROMOTION ELIGIBILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to check promotion eligibility.",
      },
      { status: 500 }
    );
  }
}