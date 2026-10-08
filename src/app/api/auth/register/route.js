import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

import {
  registerRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(request) {
  try {
    // =====================================================
    // 1. RATE LIMIT REGISTRATION
    // =====================================================

    const clientIp = getClientIp(request);

    const rateLimitIdentifier = createRateLimitIdentifier(
      "register",
      clientIp
    );

    const rateLimitResult =
      await registerRateLimit.limit(rateLimitIdentifier);

    if (!rateLimitResult.success) {
      console.warn(
        "REGISTRATION RATE LIMIT EXCEEDED:",
        clientIp
      );

      return rateLimitResponse(rateLimitResult);
    }

    // =====================================================
    // 2. READ REQUEST BODY
    // =====================================================

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      password,
      gender,
    } = body;

    // =====================================================
    // 3. REQUIRED FIELDS
    // =====================================================

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !gender
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email, phone, password and gender are required",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 4. NORMALIZE INPUT
    // =====================================================

    const cleanName = name.toString().trim();

    const cleanEmail = email
      .toString()
      .trim()
      .toLowerCase();

    const cleanPhone = phone
      .toString()
      .trim();

    const cleanPassword = password.toString();

    const cleanGender = gender
      .toString()
      .trim()
      .toLowerCase();

    // =====================================================
    // 5. VALIDATE NAME
    // =====================================================

    if (
      cleanName.length < 2 ||
      cleanName.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must be between 2 and 100 characters",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 6. VALIDATE EMAIL
    // =====================================================

    if (cleanEmail.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is too long",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 7. VALIDATE PHONE
    // =====================================================

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number must contain exactly 10 digits",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 8. VALIDATE PASSWORD
    // =====================================================

    if (cleanPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    if (cleanPassword.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password is too long",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 9. VALIDATE GENDER
    // =====================================================

    if (
      cleanGender !== "male" &&
      cleanGender !== "female"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gender must be male or female",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 10. CONNECT DATABASE
    // =====================================================

    await connectDB();

    // =====================================================
    // 11. CHECK EXISTING USER
    // =====================================================

    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 12. HASH PASSWORD
    // =====================================================

    const hashedPassword = await bcrypt.hash(
      cleanPassword,
      12
    );

    // =====================================================
    // 13. CREATE USER
    // =====================================================

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      gender: cleanGender,
    });

    // =====================================================
    // 14. SAFE RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "User registered successfully",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    // Duplicate key protection
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email or phone already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}