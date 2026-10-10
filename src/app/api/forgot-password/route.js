
import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email";

import {
  forgotPasswordRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

const GENERIC_MESSAGE =
  "If an account exists with this email, a password reset link has been sent.";

function getAppUrl() {
  const configuredUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Production application URL is not configured.");
    }

    return "http://localhost:3000";
  }

  const url = new URL(configuredUrl);

  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);

  if (url.protocol !== "https:" && !isLocalDevelopment) {
    throw new Error(
      "Application URL must use HTTPS in production."
    );
  }

  return url.origin;
}

function isValidEmail(email) {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export async function POST(request) {
  let createdUserId = null;
  let createdTokenHash = null;

  try {
    // 1. Rate limit requests before database operations.
    const clientIp = getClientIp(request);

    const identifier = createRateLimitIdentifier(
      "forgot-password",
      clientIp
    );

    const limitResult =
      await forgotPasswordRateLimit.limit(identifier);

    if (!limitResult.success) {
      return rateLimitResponse(limitResult);
    }

    // 2. Parse and validate the request.
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

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (typeof body.email !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // 3. Validate the application URL before creating a token.
    const appUrl = getAppUrl();

    await connectDB();

    const user = await User.findOne({ email })
      .select("_id email name")
      .lean();

    // Use the same response whether the account exists or not.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: GENERIC_MESSAGE,
      });
    }

    // 4. Generate a cryptographically secure reset token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // Keep track of this token so it can be cleaned up if
    // email delivery fails.
    createdUserId = user._id;
    createdTokenHash = tokenHash;

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = new URL("/reset-password", appUrl);
    resetUrl.searchParams.set("token", rawToken);

    // 5. Send the email before invalidating previous tokens.
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: resetUrl.toString(),
    });

    // 6. Email delivery succeeded. Invalidate previous tokens.
    await PasswordResetToken.deleteMany({
      user: user._id,
      tokenHash: { $ne: tokenHash },
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

    // Remove only the token created by this request.
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
