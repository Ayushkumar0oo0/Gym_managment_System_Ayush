import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import AddOn from "@/models/AddOn";

const ALLOWED_TYPES = [
  "cardio",
  "personal_trainer",
];

// ==========================================
// HELPERS
// ==========================================

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
// GET — ADMIN: GET ONE ADD-ON
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
          message: "Add-on ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid add-on ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const addOn = await AddOn.findById(id)
      .select(
        "_id name description type price isActive createdAt updatedAt"
      )
      .lean();

    if (!addOn) {
      return NextResponse.json(
        {
          success: false,
          message: "Add-on not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        addOn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN GET ADD-ON ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch add-on.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH — ADMIN: UPDATE ADD-ON
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
          message: "Add-on ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid add-on ID.",
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

    const addOn = await AddOn.findById(id);

    if (!addOn) {
      return NextResponse.json(
        {
          success: false,
          message: "Add-on not found.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // NAME
    // ==========================================

    if (body.name !== undefined) {
      const name = normalizeName(body.name);

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Add-on name cannot be empty.",
          },
          { status: 400 }
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Add-on name cannot be longer than 100 characters.",
          },
          { status: 400 }
        );
      }

      const existingAddOn =
        await AddOn.findOne({
          name,
          _id: {
            $ne: addOn._id,
          },
        })
          .select("_id")
          .lean();

      if (existingAddOn) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another add-on with this name already exists.",
          },
          { status: 409 }
        );
      }

      addOn.name = name;
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

      addOn.description = description;
    }

    // ==========================================
    // TYPE
    // ==========================================

    if (body.type !== undefined) {
      if (
        !ALLOWED_TYPES.includes(body.type)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid add-on type.",
            allowedTypes: ALLOWED_TYPES,
          },
          { status: 400 }
        );
      }

      const existingAddOn =
        await AddOn.findOne({
          type: body.type,
          _id: {
            $ne: addOn._id,
          },
        })
          .select("_id")
          .lean();

      if (existingAddOn) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An add-on with this type already exists.",
          },
          { status: 409 }
        );
      }

      addOn.type = body.type;
    }

    // ==========================================
    // PRICE
    // ==========================================

    if (body.price !== undefined) {
      const numericPrice = Number(body.price);

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

      addOn.price =
        Math.round(numericPrice * 100) / 100;
    }

    // ==========================================
    // ACTIVE STATUS
    // ==========================================

    if (body.isActive !== undefined) {
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

      addOn.isActive = body.isActive;
    }

    // ==========================================
    // SAVE
    // ==========================================

    await addOn.save();

    return NextResponse.json(
      {
        success: true,
        message: "Add-on updated successfully.",

        addOn: {
          _id: addOn._id,
          name: addOn.name,
          description: addOn.description,
          type: addOn.type,
          price: addOn.price,
          isActive: addOn.isActive,
          createdAt: addOn.createdAt,
          updatedAt: addOn.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN UPDATE ADD-ON ERROR:",
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
        message: "Failed to update add-on.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE — ADMIN
// ==========================================

export async function DELETE(request, { params }) {
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
          message: "Add-on ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid add-on ID.",
        },
        { status: 400 }
      );
    }

    /*
     * We intentionally don't delete add-ons.
     *
     * Existing memberships/purchases may contain
     * historical references and price snapshots.
     *
     * Admin should deactivate the add-on instead.
     */

    return NextResponse.json(
      {
        success: false,
        message:
          "Add-ons cannot be deleted. Deactivate the add-on instead so historical purchase information remains safe.",
      },
      { status: 409 }
    );
  } catch (error) {
    console.error(
      "ADMIN DELETE ADD-ON ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process add-on deletion.",
      },
      { status: 500 }
    );
  }
}