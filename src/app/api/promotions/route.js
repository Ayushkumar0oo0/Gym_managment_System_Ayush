import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import {
  getClientIp,
  paymentRateLimit,
  rateLimitResponse,
} from "@/lib/rateLimit";

import Promotion from "@/models/Promotion";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    const ip = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        `member-promotions:${userId}:${ip}`
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    await connectDB();

    const now = new Date();

    const promotions = await Promotion.find({
      isActive: true,
      startDate: {
        $lte: now,
      },
      endDate: {
        $gte: now,
      },
    })
      .populate(
        "membershipPlan",
        "name price durationInDays features description"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        promotions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER PROMOTIONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load promotions.",
      },
      { status: 500 }
    );
  }
}