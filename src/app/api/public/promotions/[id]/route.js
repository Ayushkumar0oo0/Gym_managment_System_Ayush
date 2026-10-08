import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Promotion from "@/models/Promotion";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const promotionId = resolvedParams?.id;

    // --------------------------------------------------
    // 1. Validate promotion ID
    // --------------------------------------------------

    if (!promotionId || !mongoose.Types.ObjectId.isValid(promotionId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Connect database
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 3. Find promotion
    // --------------------------------------------------

    const promotion = await Promotion.findById(promotionId)
      .populate(
        "membershipPlan",
        "name description price durationInDays eligibility features isActive"
      )
      .lean();

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          message: "Promotion not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 4. Check whether promotion is active
    // --------------------------------------------------

    if (!promotion.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "This promotion is no longer active.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Check promotion date
    // --------------------------------------------------

    const now = new Date();

    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (now < startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "This promotion has not started yet.",
        },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "This promotion has expired.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Validate promotion type
    // --------------------------------------------------

    if (!["membership", "extension"].includes(promotion.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion type.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 7. Membership promotion validation
    // --------------------------------------------------

    if (promotion.type === "membership") {
      if (!promotion.membershipPlan) {
        return NextResponse.json(
          {
            success: false,
            message: "Membership plan is missing for this promotion.",
          },
          { status: 400 }
        );
      }

      if (!promotion.membershipPlan.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: "The membership plan for this promotion is no longer active.",
          },
          { status: 400 }
        );
      }

      const normalPrice = Number(promotion.membershipPlan.price);
      const offerPrice = Number(promotion.offerPrice);

      if (
        !Number.isFinite(normalPrice) ||
        !Number.isFinite(offerPrice) ||
        normalPrice < 0 ||
        offerPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid promotion pricing.",
          },
          { status: 400 }
        );
      }

      if (offerPrice > normalPrice) {
        return NextResponse.json(
          {
            success: false,
            message: "Promotion offer price cannot exceed the normal membership price.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // 8. Extension promotion validation
    // --------------------------------------------------

    if (promotion.type === "extension") {
      const extensionDays = Number(promotion.extensionDays);
      const offerPrice = Number(promotion.offerPrice);

      if (!Number.isInteger(extensionDays) || extensionDays < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid extension days.",
          },
          { status: 400 }
        );
      }

      if (!Number.isFinite(offerPrice) || offerPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid promotion price.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // 9. Return safe promotion data
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      promotion: {
        _id: promotion._id,
        type: promotion.type,
        title: promotion.title,
        description: promotion.description || "",
        posterImage: promotion.posterImage,
        offerPrice: Number(promotion.offerPrice),
        registrationFeeWaived:
          promotion.type === "membership"
            ? Boolean(promotion.registrationFeeWaived)
            : false,
        extensionDays:
          promotion.type === "extension"
            ? promotion.extensionDays
            : null,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        membershipPlan:
          promotion.type === "membership"
            ? promotion.membershipPlan
            : null,
      },
    });
  } catch (error) {
    console.error("Get public promotion detail error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch promotion.",
      },
      { status: 500 }
    );
  }
}