import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { logAdminActivity } from "@/lib/adminActivity";

const MIN_PASSWORD_LENGTH = 8;

// ==========================================
// HELPER
// Check whether the current user is admin
// ==========================================

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin permission required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    session,
  };
}

// ==========================================
// GET
// Get one admin
// ==========================================

export async function GET(request, { params }) {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    const { session } = authResult;

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    })
      .select(
        "_id name email phone role isActive createdAt updatedAt"
      )
      .lean();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin account not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        admin,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET ADMIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load admin account.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// PATCH
// Update admin account
//
// Supported fields:
//
// name
// email
// phone
// isActive
// password
// ==========================================

export async function PATCH(request, { params }) {
  try {
    // ----------------------------------------
    // 1. Authentication
    // ----------------------------------------

    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    const { session } = authResult;

    // ----------------------------------------
    // 2. Get admin ID
    // ----------------------------------------

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // 3. Connect database
    // ----------------------------------------

    await connectDB();

    // ----------------------------------------
    // 4. Find target admin
    // ----------------------------------------

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    }).select("+password");

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin account not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ----------------------------------------
    // 5. Read request
    // ----------------------------------------

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // 6. Make sure something is being changed
    // ----------------------------------------

    const allowedFields = [
      "name",
      "email",
      "phone",
      "isActive",
      "password",
    ];

    const requestedFields = Object.keys(body);

    const hasAllowedField = requestedFields.some((field) =>
      allowedFields.includes(field)
    );

    if (!hasAllowedField) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid fields were provided for update.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // UPDATE NAME
    // ========================================

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      const name = body.name.trim();

      if (name.length < 2 || name.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Name must contain between 2 and 100 characters.",
          },
          {
            status: 400,
          }
        );
      }

      admin.name = name;
    }

    // ========================================
    // UPDATE EMAIL
    // ========================================

    if (body.email !== undefined) {
      if (typeof body.email !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Email must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      const email = body.email.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please provide a valid email address.",
          },
          {
            status: 400,
          }
        );
      }

      const existingEmail = await User.findOne({
        email,
        _id: {
          $ne: admin._id,
        },
      }).select("_id");

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "This email address is already in use.",
          },
          {
            status: 409,
          }
        );
      }

      admin.email = email;
    }

    // ========================================
    // UPDATE PHONE
    // ========================================

    if (body.phone !== undefined) {
      if (typeof body.phone !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Phone must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      const phone = body.phone.trim();

      const phoneRegex = /^[0-9]{10}$/;

      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Phone number must contain exactly 10 digits.",
          },
          {
            status: 400,
          }
        );
      }

      const existingPhone = await User.findOne({
        phone,
        _id: {
          $ne: admin._id,
        },
      }).select("_id");

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            message: "This phone number is already in use.",
          },
          {
            status: 409,
          }
        );
      }

      admin.phone = phone;
    }

    // ========================================
    // UPDATE PASSWORD
    // ========================================

    if (body.password !== undefined) {
      if (typeof body.password !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Password must be a string.",
          },
          {
            status: 400,
          }
        );
      }

      if (body.password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            message: `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`,
          },
          {
            status: 400,
          }
        );
      }

      if (body.password.length > 128) {
        return NextResponse.json(
          {
            success: false,
            message: "Password is too long.",
          },
          {
            status: 400,
          }
        );
      }

      admin.password = await bcrypt.hash(
        body.password,
        12
      );
    }

    // ========================================
    // UPDATE ACTIVE STATUS
    // ========================================

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isActive must be true or false.",
          },
          {
            status: 400,
          }
        );
      }

      // --------------------------------------
      // Prevent self-deactivation
      // --------------------------------------

      if (
        admin._id.toString() ===
          session.user.id &&
        body.isActive === false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You cannot deactivate your own admin account.",
          },
          {
            status: 400,
          }
        );
      }

      // --------------------------------------
      // If deactivating, make sure another
      // active admin remains.
      // --------------------------------------

      if (
        body.isActive === false &&
        admin.isActive === true
      ) {
        const activeAdminCount =
          await User.countDocuments({
            role: "admin",
            isActive: true,
          });

        if (activeAdminCount <= 1) {
          return NextResponse.json(
            {
              success: false,
              message:
                "You cannot deactivate the last active admin account.",
            },
            {
              status: 400,
            }
          );
        }
      }

      admin.isActive = body.isActive;
    }

    // ----------------------------------------
    // 7. Save changes
    // ----------------------------------------

    await admin.save();

    // ----------------------------------------
    // 8. Determine activity
    // ----------------------------------------

    let action = "UPDATE_ADMIN";
    let description = `Updated admin account for ${admin.name}`;

    if (
      body.isActive === false
    ) {
      action = "DEACTIVATE_ADMIN";

      description = `Deactivated admin account for ${admin.name}`;
    }

    if (
      body.isActive === true
    ) {
      action = "ACTIVATE_ADMIN";

      description = `Activated admin account for ${admin.name}`;
    }

    if (body.password !== undefined) {
      action = "CHANGE_ADMIN_PASSWORD";

      description = `Changed password for admin ${admin.name}`;
    }

    // ----------------------------------------
    // 9. Create audit log
    // ----------------------------------------

    await logAdminActivity({
      adminId: session.user.id,
      action,
      entityType: "User",
      entityId: admin._id,
      description,
      metadata: {
        updatedFields: Object.keys(body),
      },
    });

    // ----------------------------------------
    // 10. Safe response
    // ----------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Admin account updated successfully.",
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("UPDATE ADMIN ERROR:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with these details already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update admin account.",
      },
      {
        status: 500,
      }
    );
  }
}