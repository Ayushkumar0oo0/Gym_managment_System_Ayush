import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Promotion from "@/models/Promotion";
import MembershipPlan from "@/models/MembershipPlan";

import {
  adminRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

// ========================================
// ADMIN AUTH
// ========================================

async function requireAdmin(request, action) {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  const adminId = session.user.id;

  if (
    !adminId ||
    !mongoose.Types.ObjectId.isValid(adminId)
  ) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Invalid admin identity.",
        },
        { status: 401 }
      ),
    };
  }

  const clientIp = getClientIp(request);

  const rateLimitResult =
    await adminRateLimit.limit(
      createRateLimitIdentifier(
        action,
        `${adminId}:${clientIp}`
      )
    );

  if (!rateLimitResult.success) {
    return {
      error: rateLimitResponse(rateLimitResult),
    };
  }

  return {
    session,
    adminId,
  };
}

// ========================================
// HELPERS
// ========================================

function isValidId(id) {
  return (
    typeof id === "string" &&
    mongoose.Types.ObjectId.isValid(id)
  );
}

function isValidImageUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function parseDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// ========================================
// GET SINGLE PROMOTION
// ========================================

export async function GET(request, { params }) {
  try {
    const authResult = await requireAdmin(
      request,
      "admin-promotion-read"
    );

    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const promotion =
      await Promotion.findById(id)
        .populate(
          "membershipPlan",
          "name price durationInDays features"
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

    return NextResponse.json({
      success: true,
      promotion,
    });
  } catch (error) {
    console.error(
      "Get admin promotion error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch promotion.",
      },
      { status: 500 }
    );
  }
}

// ========================================
// UPDATE PROMOTION
// ========================================

export async function PUT(request, { params }) {
  try {
    const authResult = await requireAdmin(
      request,
      "admin-promotion-update"
    );

    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    await connectDB();

    const promotion =
      await Promotion.findById(id);

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          message: "Promotion not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // ACTIVATION / DEACTIVATION ONLY
    // ========================================

    if (
      typeof body.isActive === "boolean" &&
      Object.keys(body).length === 1
    ) {
      promotion.isActive = body.isActive;

      await promotion.save();

      return NextResponse.json({
        success: true,
        message: body.isActive
          ? "Promotion activated successfully."
          : "Promotion deactivated successfully.",
        promotion,
      });
    }

    // ========================================
    // TYPE
    // ========================================

    const type =
      body.type || promotion.type;

    if (
      !["membership", "extension"].includes(
        type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promotion type must be membership or extension.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // TITLE
    // ========================================

    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promotion title is required.",
          },
          { status: 400 }
        );
      }

      const title = body.title.trim();

      if (title.length > 150) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promotion title cannot exceed 150 characters.",
          },
          { status: 400 }
        );
      }

      promotion.title = title;
    }

    // ========================================
    // DESCRIPTION
    // ========================================

    if (body.description !== undefined) {
      const description =
        typeof body.description === "string"
          ? body.description.trim()
          : "";

      if (description.length > 1000) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promotion description cannot exceed 1000 characters.",
          },
          { status: 400 }
        );
      }

      promotion.description =
        description;
    }

    // ========================================
    // POSTER IMAGE
    // ========================================

    if (body.posterImage !== undefined) {
      if (
        !isValidImageUrl(body.posterImage)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A valid promotion poster image URL is required.",
          },
          { status: 400 }
        );
      }

      promotion.posterImage =
        body.posterImage.trim();
    }

    // ========================================
    // OFFER PRICE
    // ========================================

    if (body.offerPrice !== undefined) {
      const offerPrice = Number(
        body.offerPrice
      );

      if (
        !Number.isFinite(offerPrice) ||
        offerPrice < 0 ||
        !Number.isInteger(offerPrice)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Offer price must be a whole number greater than or equal to 0.",
          },
          { status: 400 }
        );
      }

      promotion.offerPrice = offerPrice;
    }

    // ========================================
    // DATES
    // ========================================

    if (body.startDate !== undefined) {
      const startDate = parseDate(
        body.startDate
      );

      if (!startDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid start date.",
          },
          { status: 400 }
        );
      }

      promotion.startDate = startDate;
    }

    if (body.endDate !== undefined) {
      const endDate = parseDate(
        body.endDate
      );

      if (!endDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid end date.",
          },
          { status: 400 }
        );
      }

      promotion.endDate = endDate;
    }

    if (
      promotion.endDate <=
      promotion.startDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "End date must be after start date.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // MEMBERSHIP PROMOTION
    // ========================================

    if (type === "membership") {
      let planId =
        promotion.membershipPlan?.toString();

      if (
        body.membershipPlan !== undefined
      ) {
        if (
          !isValidId(body.membershipPlan)
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid membership plan ID.",
            },
            { status: 400 }
          );
        }

        planId = body.membershipPlan;
      }

      if (!planId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Membership plan is required.",
          },
          { status: 400 }
        );
      }

      const plan =
        await MembershipPlan.findOne({
          _id: planId,
          isActive: true,
        }).lean();

      if (!plan) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected membership plan was not found or is inactive.",
          },
          { status: 400 }
        );
      }

      if (
        Number(promotion.offerPrice) >
        Number(plan.price)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Offer price cannot be greater than the regular membership price.",
          },
          { status: 400 }
        );
      }

      promotion.membershipPlan =
        plan._id;

      if (
        body.registrationFeeWaived !==
        undefined
      ) {
        promotion.registrationFeeWaived =
          Boolean(
            body.registrationFeeWaived
          );
      }

      promotion.extensionDays = null;
    }

    // ========================================
    // EXTENSION PROMOTION
    // ========================================

    if (type === "extension") {
      const extensionDays =
        body.extensionDays !== undefined
          ? Number(body.extensionDays)
          : promotion.extensionDays;

      if (
        !Number.isInteger(extensionDays) ||
        extensionDays < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Extension days must be a whole number greater than 0.",
          },
          { status: 400 }
        );
      }

      promotion.extensionDays =
        extensionDays;

      promotion.membershipPlan = null;
      promotion.registrationFeeWaived =
        false;
    }

    // ========================================
    // ACTIVE STATE
    // ========================================

    if (
      body.isActive !== undefined
    ) {
      if (
        typeof body.isActive !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "isActive must be a boolean.",
          },
          { status: 400 }
        );
      }

      promotion.isActive =
        body.isActive;
    }

    promotion.type = type;

    await promotion.save();

    const updatedPromotion =
      await Promotion.findById(id)
        .populate(
          "membershipPlan",
          "name price durationInDays features"
        )
        .lean();

    return NextResponse.json({
      success: true,
      message:
        "Promotion updated successfully.",
      promotion: updatedPromotion,
    });
  } catch (error) {
    console.error(
      "Update admin promotion error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to update promotion.",
      },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE / DEACTIVATE PROMOTION
// ========================================

export async function DELETE(
  request,
  { params }
) {
  try {
    const authResult = await requireAdmin(
      request,
      "admin-promotion-deactivate"
    );

    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const promotion =
      await Promotion.findById(id);

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          message: "Promotion not found.",
        },
        { status: 404 }
      );
    }

    promotion.isActive = false;

    await promotion.save();

    return NextResponse.json({
      success: true,
      message:
        "Promotion deactivated successfully.",
      promotion,
    });
  } catch (error) {
    console.error(
      "Deactivate promotion error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to deactivate promotion.",
      },
      { status: 500 }
    );
  }
}