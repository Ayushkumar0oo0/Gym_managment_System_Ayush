
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

export async function POST(request) {
  try {
    // 1. Validate request body.
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const token =
      typeof body.token === "string" ? body.token.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Token, password and confirm password are required.",
        },
        { status: 400 }
      );
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 128 characters.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match." },
        { status: 400 }
      );
    }

    await connectDB();

    // 2. Hash the raw token. Only the hash is stored in MongoDB.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 3. Atomically claim the token.
    // Only one concurrent request can consume this reset token.
    const now = new Date();

    const resetToken = await PasswordResetToken.findOneAndUpdate(
      {
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: now },
      },
      {
        $set: { usedAt: now },
      },
      {
        returnDocument: "after",
      }
    );

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    // 4. Verify the associated account.
    const user = await User.findById(resetToken.user).select("+password");

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to reset password. Request a new reset link.",
        },
        { status: 400 }
      );
    }

    // 5. Hash and save the new password.
    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

// Invalidate sessions created before this password reset.
user.sessionVersion = (user.sessionVersion ?? 0) + 1;

await user.save();

    // 6. Invalidate all other outstanding reset tokens for this user.
    await PasswordResetToken.updateMany(
      {
        user: user._id,
        usedAt: null,
      },
      {
        $set: { usedAt: new Date() },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", {
      name: error?.name,
      message: error?.message,
    });

    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
