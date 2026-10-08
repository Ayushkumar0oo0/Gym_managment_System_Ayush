import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import AddOn from "@/models/AddOn";

const ALLOWED_TYPES = [
  "cardio",
  "personal_trainer",
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
// GET — ADMIN: VIEW ALL ADD-ONS
// ==========================================

export async function GET() {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    await connectDB();

    const addOns = await AddOn.find({})
      .select(
        "_id name description type price isActive createdAt updatedAt"
      )
      .sort({
        type: 1,
        name: 1,
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        addOns,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN GET ADD-ONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch add-ons.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST — ADMIN: CREATE ADD-ON
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
      type,
      price,
      isActive,
    } = body;

    // ==========================================
    // NAME
    // ==========================================

    const normalizedName =
      normalizeName(name);

    if (!normalizedName) {
      return NextResponse.json(
        {
          success: false,
          message: "Add-on name is required.",
        },
        { status: 400 }
      );
    }

    if (normalizedName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Add-on name cannot be longer than 100 characters.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // DESCRIPTION
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
    // TYPE
    // ==========================================

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid add-on type.",
          allowedTypes: ALLOWED_TYPES,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // PRICE
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

    const normalizedPrice =
      Math.round(numericPrice * 100) / 100;

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
    // DUPLICATE CHECK
    // ==========================================

    const existingAddOn =
      await AddOn.findOne({
        $or: [
          {
            name: normalizedName,
          },
          {
            type,
          },
        ],
      })
        .select("_id name type")
        .lean();

    if (existingAddOn) {
      if (
        existingAddOn.type === type
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An add-on with this type already exists.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "An add-on with this name already exists.",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // CREATE
    // ==========================================

    const addOn =
      await AddOn.create({
        name: normalizedName,

        description:
          normalizedDescription,

        type,

        price:
          normalizedPrice,

        isActive:
          normalizedIsActive,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Add-on created successfully.",

        addOn: {
          _id: addOn._id,
          name: addOn.name,
          description:
            addOn.description,
          type: addOn.type,
          price: addOn.price,
          isActive:
            addOn.isActive,
          createdAt:
            addOn.createdAt,
          updatedAt:
            addOn.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADMIN CREATE ADD-ON ERROR:",
      error
    );

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An add-on with these details already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create add-on.",
      },
      { status: 500 }
    );
  }
}