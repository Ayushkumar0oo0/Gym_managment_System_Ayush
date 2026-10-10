
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

function isValidEmail(email) {
  return (
    email.length <= 150 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export async function POST(request) {
  try {
    // 1. Rate limit registration.
    const clientIp = getClientIp(request);

    const identifier = createRateLimitIdentifier(
      "register",
      clientIp
    );

    const rateLimitResult =
      await registerRateLimit.limit(identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // 2. Parse request body.
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    // 3. Validate field types before processing.
    const { name, email, phone, password, gender } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string" ||
      typeof gender !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email, phone, password and gender are required.",
        },
        { status: 400 }
      );
    }

    // 4. Normalize input.
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanGender = gender.trim().toLowerCase();

    // Do not trim passwords; whitespace can be intentional.
    const cleanPassword = password;

    // 5. Validate name.
    if (cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be between 2 and 100 characters.",
        },
        { status: 400 }
      );
    }

    // 6. Validate email.
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // 7. Validate phone.
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number must contain exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    // 8. Validate password.
    if (
      cleanPassword.length < 8 ||
      cleanPassword.length > 128
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 128 characters.",
        },
        { status: 400 }
      );
    }

    // 9. Validate gender.
    if (!["male", "female"].includes(cleanGender)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid gender.",
        },
        { status: 400 }
      );
    }

    // 10. Connect to the database.
    await connectDB();

    // 11. Check existing accounts.
    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone },
      ],
    }).select("_id");

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email or phone already exists.",
        },
        { status: 409 }
      );
    }

    // 12. Hash password.
    const hashedPassword = await bcrypt.hash(cleanPassword, 12);

    // 13. Create member account.
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      gender: cleanGender,
      role: "member",
    });

    // 14. Return safe user information only.
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully.",
        user: {
          id: user._id.toString(),
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
    // Handle concurrent duplicate registrations.
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email or phone already exists.",
        },
        { status: 409 }
      );
    }

    // Avoid logging request bodies or passwords.
    console.error("Registration error:", {
      name: error?.name,
      message: error?.message,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}