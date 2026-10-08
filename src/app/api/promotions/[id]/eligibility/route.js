import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import {
  getClientIp,
  paymentRateLimit,
  rateLimitResponse,
} from "@/lib/rateLimit";

import Promotion from "@/models/Promotion";
import Membership from "@/models/Membership";

export async function GET(request, { params }) {
  try {
    // --------------------------------
    // 1. CHECK LOGIN
    // --------------------------------

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message: "Please login to purchase this offer.",
        },
        { status: 401 }
      );
    }

    // --------------------------------
    // 2. CHECK USER ROLE
    // --------------------------------

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message:
            "Only members can purchase membership extension offers.",
        },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message: "Invalid user session.",
        },
        { status: 401 }
      );
    }

    // --------------------------------
    // 3. RATE LIMIT
    // --------------------------------

    const ip = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        `promotion-eligibility:${userId}:${ip}`
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // --------------------------------
    // 4. GET PROMOTION ID
    // --------------------------------

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message: "Invalid promotion ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // --------------------------------
    // 5. FIND PROMOTION
    // --------------------------------

    const promotion = await Promotion.findById(id)
      .select(
        "title description posterImage offerPrice extensionDays startDate endDate isActive type"
      )
      .lean();

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message: "Promotion not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------
    // 6. CHECK PROMOTION TYPE
    // --------------------------------

    if (promotion.type !== "extension") {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message:
            "This promotion is not a membership extension offer.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // 7. CHECK PROMOTION ACTIVE STATUS
    // --------------------------------

    if (!promotion.isActive) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message: "This promotion is no longer active.",
        },
        { status: 410 }
      );
    }

    // --------------------------------
    // 8. CHECK PROMOTION DATE
    // --------------------------------

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
          eligible: false,
          message:
            "This promotion has invalid dates.",
        },
        { status: 400 }
      );
    }

    if (now < startDate) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message:
            "This promotion has not started yet.",
        },
        { status: 410 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message: "This promotion has expired.",
        },
        { status: 410 }
      );
    }

    // --------------------------------
    // 9. VALIDATE EXTENSION DAYS
    // --------------------------------

    const extensionDays =
      Number(promotion.extensionDays);

    if (
      !Number.isInteger(extensionDays) ||
      extensionDays < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message:
            "This promotion is not configured correctly.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // 10. VALIDATE OFFER PRICE
    // --------------------------------

    const offerPrice =
      Number(promotion.offerPrice);

    if (
      !Number.isFinite(offerPrice) ||
      offerPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message:
            "This promotion has an invalid offer price.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // 11. FIND ACTIVE MEMBERSHIP
    // --------------------------------
    //
    // A member can be:
    //
    // 1. Primary member
    // 2. Secondary member of a couple
    //
    // Therefore check both fields.

    const membership =
      await Membership.findOne({
        $or: [
          { user: userId },
          { secondaryUser: userId },
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

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message:
            "You need an active membership to purchase this offer.",
        },
        { status: 403 }
      );
    }

    // --------------------------------
    // 12. VALIDATE MEMBERSHIP END DATE
    // --------------------------------

    const membershipEndDate =
      new Date(membership.endDate);

    if (
      Number.isNaN(
        membershipEndDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          message:
            "Your membership has an invalid end date.",
        },
        { status: 500 }
      );
    }

    // --------------------------------
    // 13. CALCULATE REMAINING DAYS
    // --------------------------------

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    const remainingDays = Math.max(
      0,
      Math.ceil(
        (membershipEndDate.getTime() -
          now.getTime()) /
          millisecondsPerDay
      )
    );

    // --------------------------------
    // 14. CALCULATE NEW END DATE
    // --------------------------------

    const newEndDate =
      new Date(membershipEndDate);

    newEndDate.setDate(
      newEndDate.getDate() +
        extensionDays
    );

    // --------------------------------
    // 15. USER IS ELIGIBLE
    // --------------------------------

    return NextResponse.json(
      {
        success: true,
        eligible: true,

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
          id: membership._id,
          plan: membership.plan,
          startDate: membership.startDate,
          endDate: membership.endDate,
          remainingDays,
          newEndDate,
        },

        pricing: {
          totalAmount: offerPrice,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PROMOTION ELIGIBILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        eligible: false,
        message:
          "Something went wrong while checking eligibility.",
      },
      { status: 500 }
    );
  }
}