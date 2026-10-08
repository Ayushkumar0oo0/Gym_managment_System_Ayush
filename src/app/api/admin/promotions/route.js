import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Promotion from "@/models/Promotion";
import MembershipPlan from "@/models/MembershipPlan";


// ========================================
// GET ALL PROMOTIONS
// ========================================

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const promotions = await Promotion.find()
      .populate(
        "membershipPlan",
        "name price durationInDays features"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      promotions,
    });
  } catch (error) {
    console.error(
      "Get promotions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch promotions",
      },
      { status: 500 }
    );
  }
}


// ========================================
// CREATE PROMOTION
// ========================================

export async function POST(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      type,
      title,
      description,
      posterImage,
      offerPrice,
      membershipPlan,
      registrationFeeWaived,
      extensionDays,
      startDate,
      endDate,
      isActive,
    } = body;

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (
      !type ||
      !["membership", "extension"].includes(
        type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promotion type must be membership or extension",
        },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Promotion title is required",
        },
        { status: 400 }
      );
    }

    if (!posterImage?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promotion poster image is required",
        },
        { status: 400 }
      );
    }

    if (
      offerPrice === undefined ||
      offerPrice === null ||
      Number.isNaN(Number(offerPrice)) ||
      Number(offerPrice) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid offer price is required",
        },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Start date and end date are required",
        },
        { status: 400 }
      );
    }

    const promotionStartDate =
      new Date(startDate);

    const promotionEndDate =
      new Date(endDate);

    if (
      Number.isNaN(
        promotionStartDate.getTime()
      ) ||
      Number.isNaN(
        promotionEndDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion dates",
        },
        { status: 400 }
      );
    }

    if (
      promotionEndDate <=
      promotionStartDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "End date must be after start date",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // ========================================
    // MEMBERSHIP OFFER VALIDATION
    // ========================================

    if (type === "membership") {
      if (!membershipPlan) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Membership plan is required for this offer",
          },
          { status: 400 }
        );
      }

      const plan =
        await MembershipPlan.findOne({
          _id: membershipPlan,
          isActive: true,
        });

      if (!plan) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected membership plan does not exist or is inactive",
          },
          { status: 400 }
        );
      }
    }

    // ========================================
    // EXTENSION OFFER VALIDATION
    // ========================================

    if (type === "extension") {
      if (
        extensionDays === undefined ||
        extensionDays === null ||
        Number.isNaN(
          Number(extensionDays)
        ) ||
        Number(extensionDays) < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Extension days must be at least 1",
          },
          { status: 400 }
        );
      }
    }

    // ========================================
    // CREATE DATA
    // ========================================

    const promotionData = {
      type,

      title: title.trim(),

      description:
        description?.trim() || "",

      posterImage:
        posterImage.trim(),

      offerPrice:
        Number(offerPrice),

      startDate:
        promotionStartDate,

      endDate:
        promotionEndDate,

      isActive:
        isActive !== false,
    };

    // Membership-specific fields

    if (type === "membership") {
      promotionData.membershipPlan =
        membershipPlan;

      promotionData.registrationFeeWaived =
        Boolean(
          registrationFeeWaived
        );

      promotionData.extensionDays =
        null;
    }

    // Extension-specific fields

    if (type === "extension") {
      promotionData.extensionDays =
        Number(extensionDays);

      promotionData.membershipPlan =
        null;

      promotionData.registrationFeeWaived =
        false;
    }

    // ========================================
    // SAVE
    // ========================================

    const promotion =
      await Promotion.create(
        promotionData
      );

    // Populate plan before returning

    await promotion.populate(
      "membershipPlan",
      "name price durationInDays features"
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Promotion created successfully",
        promotion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create promotion error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to create promotion",
      },
      { status: 500 }
    );
  }
}