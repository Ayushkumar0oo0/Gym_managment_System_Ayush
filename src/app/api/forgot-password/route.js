import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("_id email name");

    // Don't reveal whether an email exists.
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Remove previous tokens for this user.
    await PasswordResetToken.deleteMany({
      user: user._id,
    });

    // Generate secure random token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash token before storing it in MongoDB.
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Token expires after 15 minutes.
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}