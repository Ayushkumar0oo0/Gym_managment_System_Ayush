import { NextResponse } from "next/server";

import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import MembershipPlan from "@/models/MembershipPlan";
import Membership from "@/models/Membership";

const ALLOWED_ELIGIBILITY = [
  "both",
  "male",
  "female",
];

function normalizeName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function normalizeDescription(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isValidEligibility(value) {
  return ALLOWED_ELIGIBILITY.includes(value);
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
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

  return {
    session,
  };
}

// ==========================================
// GET — ADMIN: GET ONE PLAN
// ==========================================

export async function GET(request, { params }) {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid membership plan ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const plan = await MembershipPlan.findById(id)
      .select(
        "_id name description price durationInDays eligibility features isActive createdAt updatedAt"
      )
      .lean();

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        plan,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN GET MEMBERSHIP PLAN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch membership plan.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH — ADMIN: UPDATE PLAN
// ==========================================

export async function PATCH(request, { params }) {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid membership plan ID.",
        },
        { status: 400 }
      );
    }

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

    await connectDB();

    const plan =
      await MembershipPlan.findById(id);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan not found.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // NAME
    // ==========================================

    if (body.name !== undefined) {
      const normalizedName =
        normalizeName(body.name);

      if (!normalizedName) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Plan name cannot be empty.",
          },
          { status: 400 }
        );
      }

      if (normalizedName.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Plan name cannot be longer than 100 characters.",
          },
          { status: 400 }
        );
      }

      const existingPlan =
        await MembershipPlan.findOne({
          name: normalizedName,
          _id: {
            $ne: plan._id,
          },
        })
          .select("_id")
          .lean();

      if (existingPlan) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another membership plan with this name already exists.",
          },
          { status: 409 }
        );
      }

      plan.name = normalizedName;
    }

    // ==========================================
    // DESCRIPTION
    // ==========================================

    if (body.description !== undefined) {
      if (
        typeof body.description !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Description must be a string.",
          },
          { status: 400 }
        );
      }

      const description =
        normalizeDescription(
          body.description
        );

      if (description.length > 500) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Description cannot be longer than 500 characters.",
          },
          { status: 400 }
        );
      }

      plan.description = description;
    }

    // ==========================================
    // PRICE
    // ==========================================

    if (body.price !== undefined) {
      const numericPrice =
        Number(body.price);

      if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Price must be a valid non-negative number.",
          },
          { status: 400 }
        );
      }

      plan.price =
        Math.round(numericPrice * 100) / 100;
    }

    // ==========================================
    // DURATION
    // ==========================================

    if (
      body.durationInDays !==
      undefined
    ) {
      const numericDuration =
        Number(body.durationInDays);

      if (
        !Number.isInteger(
          numericDuration
        ) ||
        numericDuration < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Duration must be a positive whole number of days.",
          },
          { status: 400 }
        );
      }

      plan.durationInDays =
        numericDuration;
    }

    // ==========================================
    // ELIGIBILITY
    // ==========================================

    if (
      body.eligibility !== undefined
    ) {
      if (
        !isValidEligibility(
          body.eligibility
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid plan eligibility.",
            allowedEligibility:
              ALLOWED_ELIGIBILITY,
          },
          { status: 400 }
        );
      }

      plan.eligibility =
        body.eligibility;
    }

    // ==========================================
    // ACTIVE STATUS
    // ==========================================

    if (body.isActive !== undefined) {
      if (
        typeof body.isActive !==
        "boolean"
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

      plan.isActive =
        body.isActive;
    }

    // ==========================================
    // FORCE BASE FEATURE
    // ==========================================

    /*
     * Gym is always the base service.
     *
     * Cardio and Personal Trainer are handled
     * by the AddOn model.
     */
    plan.features = ["gym"];

    // ==========================================
    // SAVE
    // ==========================================

    await plan.save();

    return NextResponse.json(
      {
        success: true,
        message:
          "Membership plan updated successfully.",

        plan: {
          _id: plan._id,
          name: plan.name,
          description:
            plan.description,
          price: plan.price,
          durationInDays:
            plan.durationInDays,
          eligibility:
            plan.eligibility,
          features:
            plan.features,
          isActive:
            plan.isActive,
          createdAt:
            plan.createdAt,
          updatedAt:
            plan.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN UPDATE MEMBERSHIP PLAN ERROR:",
      error
    );

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A membership plan with this name already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update membership plan.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE — ADMIN
// ==========================================

export async function DELETE(
  request,
  { params }
) {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid membership plan ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const plan =
      await MembershipPlan.findById(id);

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Membership plan not found.",
        },
        { status: 404 }
      );
    }

    /*
     * We deliberately do NOT delete membership plans.
     *
     * Historical memberships and payments can depend
     * on this plan. Removing it could damage historical
     * records and reporting.
     *
     * Instead:
     *
     * isActive = false
     *
     * prevents new customers from purchasing it while
     * preserving historical data.
     */
    return NextResponse.json(
      {
        success: false,
        message:
          "Membership plans cannot be deleted. Deactivate the plan instead so historical memberships and payments remain safe.",
      },
      { status: 409 }
    );
  } catch (error) {
    console.error(
      "ADMIN DELETE MEMBERSHIP PLAN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process membership plan deletion.",
      },
      { status: 500 }
    );
  }
}