import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { logAdminActivity } from "@/lib/adminActivity";

// Maximum number of admin accounts allowed
const MAX_ADMINS = 3;

// Password requirements
const MIN_PASSWORD_LENGTH = 8;

// ==========================================
// GET
// Get all admin accounts
// ==========================================

export async function GET() {
  try {
    // ----------------------------------------
    // 1. Check authentication
    // ----------------------------------------

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // ----------------------------------------
    // 2. Check admin permission
    // ----------------------------------------

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin permission required.",
        },
        {
          status: 403,
        }
      );
    }

    // ----------------------------------------
    // 3. Connect database
    // ----------------------------------------

    await connectDB();

    // ----------------------------------------
    // 4. Get all admins
    // ----------------------------------------

    const admins = await User.find({
      role: "admin",
    })
      .select(
        "_id name email phone role isActive createdAt updatedAt"
      )
      .sort({
        createdAt: 1,
      })
      .lean();

    // ----------------------------------------
    // 5. Return admins
    // ----------------------------------------

    return NextResponse.json(
      {
        success: true,
        admins,
        totalAdmins: admins.length,
        maxAdmins: MAX_ADMINS,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET ADMIN ACCOUNTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load admin accounts.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// POST
// Create a new admin account
// ==========================================

export async function POST(request) {
  try {
    // ----------------------------------------
    // 1. Check authentication
    // ----------------------------------------

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // ----------------------------------------
    // 2. Check admin permission
    // ----------------------------------------

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin permission required.",
        },
        {
          status: 403,
        }
      );
    }

    // ----------------------------------------
    // 3. Connect database
    // ----------------------------------------

    await connectDB();

    // ----------------------------------------
    // 4. Parse request body
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
    // 5. Get input values
    // ----------------------------------------

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // ----------------------------------------
    // 6. Validate name
    // ----------------------------------------

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin name must contain at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin name is too long.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // 7. Validate email
    // ----------------------------------------

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

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

    // ----------------------------------------
    // 8. Validate phone
    // ----------------------------------------

    const phoneRegex = /^[0-9]{10}$/;

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number must contain exactly 10 digits.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // 9. Validate password
    // ----------------------------------------

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
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

    if (password.length > 128) {
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

    // ----------------------------------------
    // 10. Count admins
    // ----------------------------------------

    const adminCount = await User.countDocuments({
      role: "admin",
    });

    // ----------------------------------------
    // 11. Maximum 3 admins
    // ----------------------------------------

    if (adminCount >= MAX_ADMINS) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum of 3 admin accounts is allowed.",
        },
        {
          status: 409,
        }
      );
    }

    // ----------------------------------------
    // 12. Check duplicate email
    // ----------------------------------------

    const existingEmail = await User.findOne({
      email,
    }).select("_id");

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    // ----------------------------------------
    // 13. Check duplicate phone
    // ----------------------------------------

    const existingPhone = await User.findOne({
      phone,
    }).select("_id");

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this phone number already exists.",
        },
        {
          status: 409,
        }
      );
    }

    // ----------------------------------------
    // 14. Hash password
    // ----------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // ----------------------------------------
    // 15. Create admin
    // ----------------------------------------

    const newAdmin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      registrationFeePaid: false,
    });

    // ----------------------------------------
    // 16. Log admin activity
    // ----------------------------------------

    await logAdminActivity({
      adminId: session.user.id,
      action: "CREATE_ADMIN",
      entityType: "User",
      entityId: newAdmin._id,
      description: `Created admin account for ${newAdmin.name}`,
      metadata: {
        adminEmail: newAdmin.email,
      },
    });

    // ----------------------------------------
    // 17. Safe response
    // ----------------------------------------
    // IMPORTANT:
    // Never return the password or password hash.
    // ----------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully.",
        admin: {
          _id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          phone: newAdmin.phone,
          role: newAdmin.role,
          isActive: newAdmin.isActive,
          createdAt: newAdmin.createdAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("CREATE ADMIN ACCOUNT ERROR:", error);

    // Handle MongoDB duplicate-key errors safely
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with these details already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create admin account.",
      },
      {
        status: 500,
      }
    );
  }
}