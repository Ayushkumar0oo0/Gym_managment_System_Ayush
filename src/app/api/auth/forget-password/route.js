
import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_MESSAGE =
  "If an account exists with this email, a password reset link has been sent.";

function getAppUrl() {
  const configuredUrl =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Production application URL is not configured.");
    }

    return "http://localhost:3000";
  }

  const url = new URL(configuredUrl);

  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  ) {
    throw new Error("Application URL must use HTTPS in production.");
  }

  return url.origin;
}

export async function POST(request) {
  let createdUserId = null;
  let createdTokenHash = null;

  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const rawEmail = body?.email;

    if (typeof rawEmail !== "string" || !rawEmail.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email }).select("_id email name");

    // Avoid revealing whether an account exists.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: GENERIC_MESSAGE,
      });
    }

    // Invalidate previous reset tokens for this user.
    await PasswordResetToken.deleteMany({ user: user._id });

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    createdUserId = user._id;
    createdTokenHash = tokenHash;

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    const appUrl = getAppUrl();
    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("token", rawToken);

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: resetUrl.toString(),
    });

    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", {
      name: error?.name,
      message: error?.message,
    });

    // Remove only the token created by this request if it failed.
    if (createdUserId && createdTokenHash) {
      try {
        await PasswordResetToken.deleteOne({
          user: createdUserId,
          tokenHash: createdTokenHash,
        });
      } catch (cleanupError) {
        console.error("RESET TOKEN CLEANUP ERROR:", {
          name: cleanupError?.name,
          message: cleanupError?.message,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
