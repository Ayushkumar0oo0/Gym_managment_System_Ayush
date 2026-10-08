import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

export async function POST(request) {
  try {
    /*
     * ----------------------------------------------------
     * 1. READ REQUEST BODY
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

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    /*
     * ----------------------------------------------------
     * 2. BASIC VALIDATION
     * ----------------------------------------------------
     */

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Token, password and confirm password are required",
        },
        { status: 400 }
      );
    }

    /*
     * Our reset token is generated using:
     *
     * crypto.randomBytes(32).toString("hex")
     *
     * 32 bytes = 64 hexadecimal characters.
     */

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------
     * 3. PASSWORD VALIDATION
     * ----------------------------------------------------
     */

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is too long",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match",
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
     * 5. HASH THE TOKEN
     * ----------------------------------------------------
     *
     * We hash the token received from the URL and search
     * for the hash stored in MongoDB.
     *
     * The original token is never stored in the database.
     */

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    /*
     * ----------------------------------------------------
     * 6. FIND VALID RESET TOKEN
     * ----------------------------------------------------
     */

    const resetToken =
      await PasswordResetToken.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: {
          $gt: new Date(),
        },
      });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------
     * 7. FIND USER
     * ----------------------------------------------------
     */

    const user = await User.findById(
      resetToken.user
    ).select("+password");

    if (!user) {
      /*
       * Invalidate the reset token if the associated
       * account no longer exists.
       */

      resetToken.usedAt = new Date();
      await resetToken.save();

      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------
     * 8. CHECK ACCOUNT STATUS
     * ----------------------------------------------------
     */

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to reset password for this account",
        },
        { status: 403 }
      );
    }

    /*
     * ----------------------------------------------------
     * 9. HASH NEW PASSWORD
     * ----------------------------------------------------
     */

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    /*
     * ----------------------------------------------------
     * 10. UPDATE PASSWORD
     * ----------------------------------------------------
     */

    user.password = hashedPassword;

    await user.save();

    /*
     * ----------------------------------------------------
     * 11. INVALIDATE RESET TOKEN
     * ----------------------------------------------------
     *
     * The same reset link cannot be used again.
     */

    resetToken.usedAt = new Date();

    await resetToken.save();

    /*
     * ----------------------------------------------------
     * 12. INVALIDATE OTHER RESET TOKENS
     * ----------------------------------------------------
     *
     * Any older reset links for this account are also
     * invalidated.
     */

    await PasswordResetToken.updateMany(
      {
        user: user._id,
        usedAt: null,
      },
      {
        $set: {
          usedAt: new Date(),
        },
      }
    );

    /*
     * ----------------------------------------------------
     * 13. SUCCESS
     * ----------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    /*
     * Never expose internal errors to the client.
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