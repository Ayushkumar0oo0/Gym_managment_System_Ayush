import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import MembershipPlan from "@/models/MembershipPlan";

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

function validateEligibility(value) {
  return ALLOWED_ELIGIBILITY.includes(value);
}

// ==========================================
// ADMIN AUTH CHECK
// ==========================================

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
// GET — ADMIN: VIEW ALL PLANS
// ==========================================

export async function GET() {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    await connectDB();

    const plans = await MembershipPlan.find({})
      .select(
        "_id name description price durationInDays eligibility features isActive createdAt updatedAt"
      )
      .sort({
        durationInDays: 1,
        name: 1,
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        plans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN GET MEMBERSHIP PLANS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch membership plans.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST — ADMIN: CREATE PLAN
// ==========================================

export async function POST(request) {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
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

    const {
      name,
      description,
      price,
      durationInDays,
      eligibility,
      isActive,
    } = body;

    // ==========================================
    // VALIDATE NAME
    // ==========================================

    const normalizedName = normalizeName(name);

    if (!normalizedName) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan name is required.",
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

    // ==========================================
    // VALIDATE DESCRIPTION
    // ==========================================

    const normalizedDescription =
      normalizeDescription(description);

    if (normalizedDescription.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Description cannot be longer than 500 characters.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // VALIDATE PRICE
    // ==========================================

    const numericPrice = Number(price);

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

    // Keep money values to two decimal places.
    const normalizedPrice =
      Math.round(numericPrice * 100) / 100;

    // ==========================================
    // VALIDATE DURATION
    // ==========================================

    const numericDuration = Number(durationInDays);

    if (
      !Number.isInteger(numericDuration) ||
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

    // ==========================================
    // VALIDATE ELIGIBILITY
    // ==========================================

    const normalizedEligibility =
      eligibility || "both";

    if (
      !validateEligibility(
        normalizedEligibility
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid plan eligibility.",
          allowedEligibility:
            ALLOWED_ELIGIBILITY,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // ACTIVE STATUS
    // ==========================================

    const normalizedIsActive =
      typeof isActive === "boolean"
        ? isActive
        : true;

    // ==========================================
    // DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // DUPLICATE NAME CHECK
    // ==========================================

    const existingPlan =
      await MembershipPlan.findOne({
        name: normalizedName,
      })
        .select("_id name")
        .lean();

    if (existingPlan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A membership plan with this name already exists.",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // CREATE PLAN
    // ==========================================

    const plan =
      await MembershipPlan.create({
        name: normalizedName,

        description:
          normalizedDescription,

        price: normalizedPrice,

        durationInDays:
          numericDuration,

        /*
         * Gym is always the base service.
         *
         * Cardio and personal trainer are NOT stored
         * here anymore. They are separate AddOns.
         */
        features: ["gym"],

        eligibility:
          normalizedEligibility,

        isActive:
          normalizedIsActive,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Membership plan created successfully.",

        plan: {
          _id: plan._id,
          name: plan.name,
          description: plan.description,
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
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADMIN CREATE MEMBERSHIP PLAN ERROR:",
      error
    );

    // Handle MongoDB duplicate-key errors.
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
          "Failed to create membership plan.",
      },
      { status: 500 }
    );
  }
}