import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Promotion from "@/models/Promotion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate(
        "membershipPlan",
        "name description price durationInDays eligibility features"
      )
      .select(
        "_id type title description posterImage offerPrice membershipPlan registrationFeeWaived extensionDays startDate endDate isActive createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        promotions,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("PUBLIC PROMOTIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load promotions.",
        promotions: [],
      },
      {
        status: 500,
      }
    );
  }
}