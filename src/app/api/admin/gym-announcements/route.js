import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import GymAnnouncement from "@/models/GymAnnouncement";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const announcements = await GymAnnouncement.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("ADMIN GYM ANNOUNCEMENTS GET ERROR:", error);

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

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const {
      title,
      message,
      type,
      startDate,
      endDate,
      isActive,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required.",
        },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Message is required.",
        },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date and end date are required.",
        },
        { status: 400 }
      );
    }

    const announcement = await GymAnnouncement.create({
      title: title.trim(),
      message: message.trim(),
      type: type || "info",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Announcement created successfully.",
        announcement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADMIN GYM ANNOUNCEMENTS POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create gym announcement.",
      },
      { status: 500 }
    );
  }
}