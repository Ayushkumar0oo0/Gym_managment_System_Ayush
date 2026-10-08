import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

import {
  forgotPasswordRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

export async function POST(request) {
  try {
    /*
     * ----------------------------------------------------
     * 1. RATE LIMIT
     * ----------------------------------------------------
     *
     * 3 requests per 15 minutes per IP.
     */

    const clientIp = getClientIp(request);

    const rateLimitIdentifier = createRateLimitIdentifier(
      "forgot-password",
      clientIp
    );

    const rateLimitResult =
      await forgotPasswordRateLimit.limit(
        rateLimitIdentifier
      );

    if (!rateLimitResult.success) {
      console.warn(
        "FORGOT PASSWORD RATE LIMIT EXCEEDED:",
        clientIp
      );

      return rateLimitResponse(rateLimitResult);
    }

    /*
     * ----------------------------------------------------
     * 2. READ REQUEST BODY
     * ----------------------------------------------------
     */

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

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    /*
     * ----------------------------------------------------
     * 3. BASIC VALIDATION
     * ----------------------------------------------------
     */

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    if (email.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------
     * 4. CONNECT DATABASE
     * ----------------------------------------------------
     */

    await connectDB();

    /*
     * ----------------------------------------------------
     * 5. FIND USER
     * ----------------------------------------------------
     */

    const user = await User.findOne({
      email,
    });

    /*
     * ----------------------------------------------------
     * 6. GENERIC RESPONSE FOR UNKNOWN EMAIL
     * ----------------------------------------------------
     *
     * IMPORTANT:
     *
     * We intentionally don't tell the requester whether
     * this email belongs to an account.
     *
     * This prevents account enumeration.
     */

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    /*
     * ----------------------------------------------------
     * 7. DON'T SEND RESET LINKS TO INACTIVE ACCOUNTS
     * ----------------------------------------------------
     */

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    /*
     * ----------------------------------------------------
     * 8. INVALIDATE OLD RESET TOKENS
     * ----------------------------------------------------
     *
     * A user should not have many active reset links.
     */

    await PasswordResetToken.deleteMany({
      user: user._id,
      usedAt: null,
    });

    /*
     * ----------------------------------------------------
     * 9. GENERATE SECURE RANDOM TOKEN
     * ----------------------------------------------------
     *
     * crypto.randomBytes() generates cryptographically
     * secure random data.
     *
     * The raw token is sent by email.
     * We NEVER store the raw token in MongoDB.
     */

    const rawToken = crypto.randomBytes(32).toString("hex");

    /*
     * ----------------------------------------------------
     * 10. HASH TOKEN
     * ----------------------------------------------------
     *
     * SHA-256 hash is stored in MongoDB.
     */

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    /*
     * ----------------------------------------------------
     * 11. TOKEN EXPIRATION
     * ----------------------------------------------------
     */

    const expiresAt = new Date(
      Date.now() +
        RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    /*
     * ----------------------------------------------------
     * 12. SAVE HASHED TOKEN
     * ----------------------------------------------------
     */

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    /*
     * ----------------------------------------------------
     * 13. CREATE RESET URL
     * ----------------------------------------------------
     */

    const appUrl = process.env.NEXTAUTH_URL;

    if (!appUrl) {
      console.error(
        "NEXTAUTH_URL is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Something went wrong",
        },
        { status: 500 }
      );
    }

    const resetUrl =
      `${appUrl.replace(/\/$/, "")}` +
      `/reset-password?token=${encodeURIComponent(rawToken)}`;

    /*
     * ----------------------------------------------------
     * 14. SEND EMAIL
     * ----------------------------------------------------
     */

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailError) {
      console.error(
        "PASSWORD RESET EMAIL FAILED:",
        emailError
      );

      /*
       * If email sending fails, remove the token so it
       * cannot remain active without the user receiving it.
       */

      await PasswordResetToken.deleteOne({
        _id: (
          await PasswordResetToken.findOne({
            user: user._id,
            tokenHash,
          }).select("_id")
        )?._id,
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to send password reset email. Please try again later.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------------------
     * 15. GENERIC SUCCESS RESPONSE
     * ----------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    /*
     * Never expose internal database/email errors
     * to the client.
     */

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}