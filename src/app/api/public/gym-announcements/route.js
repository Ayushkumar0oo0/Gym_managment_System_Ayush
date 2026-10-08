import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GymAnnouncement from "@/models/GymAnnouncement";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    const announcements = await GymAnnouncement.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .select(
        "title message type startDate endDate isActive createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error(
      "PUBLIC GYM ANNOUNCEMENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load gym announcements.",
        announcements: [],
      },
      { status: 500 }
    );
  }
}