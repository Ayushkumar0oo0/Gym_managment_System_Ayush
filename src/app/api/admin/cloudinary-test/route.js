import { NextResponse } from "next/server";

import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const result = await cloudinary.api.ping();

    return NextResponse.json({
      success: true,
      message: "Cloudinary connection successful.",
      status: result.status,
    });
  } catch (error) {
    console.error(
      "Cloudinary test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Cloudinary connection failed.",
      },
      { status: 500 }
    );
  }
}