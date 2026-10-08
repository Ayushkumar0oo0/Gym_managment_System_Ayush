import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import GymAnnouncement from "@/models/GymAnnouncement";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

async function checkAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

export async function GET(request, { params }) {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid announcement ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const announcement = await GymAnnouncement.findById(id).lean();

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error("ADMIN GYM ANNOUNCEMENT GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load announcement.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid announcement ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    const updateData = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }

    if (body.message !== undefined) {
      updateData.message = body.message.trim();
    }

    if (body.type !== undefined) {
      updateData.type = body.type;
    }

    if (body.startDate !== undefined) {
      updateData.startDate = new Date(body.startDate);
    }

    if (body.endDate !== undefined) {
      updateData.endDate = new Date(body.endDate);
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    const announcement = await GymAnnouncement.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully.",
      announcement,
    });
  } catch (error) {
    console.error("ADMIN GYM ANNOUNCEMENT PUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update announcement.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid announcement ID.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const announcement = await GymAnnouncement.findByIdAndDelete(id);

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN GYM ANNOUNCEMENT DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete announcement.",
      },
      { status: 500 }
    );
  }
}