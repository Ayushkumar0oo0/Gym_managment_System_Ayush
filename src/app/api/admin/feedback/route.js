import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Feedback from "@/models/Feedback";

const ALLOWED_STATUSES = [
  "new",
  "reviewing",
  "resolved",
  "rejected",
];

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "all";

    const query = {};

    if (status !== "all") {
      if (!ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid status filter.",
          },
          { status: 400 }
        );
      }

      query.status = status;
    }

    if (category !== "all") {
      query.category = category;
    }

    const feedback = await Feedback.find(query)
      .populate("user", "name email phone")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const counts = await Feedback.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      new: 0,
      reviewing: 0,
      resolved: 0,
      rejected: 0,
    };

    counts.forEach((item) => {
      if (item._id in statusCounts) {
        statusCounts[item._id] = item.count;
      }
    });

    return NextResponse.json({
      success: true,
      feedback,
      counts: {
        total: feedback.length,
        new: statusCounts.new,
        reviewing: statusCounts.reviewing,
        resolved: statusCounts.resolved,
        rejected: statusCounts.rejected,
      },
    });
  } catch (error) {
    console.error("ADMIN FEEDBACK GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load feedback.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const feedbackId = String(body.feedbackId || "").trim();
    const status = String(body.status || "").trim();
    const adminNote = String(body.adminNote || "").trim();

    if (!feedbackId) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback ID is required.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid feedback status.",
        },
        { status: 400 }
      );
    }

    if (adminNote.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin note cannot exceed 500 characters.",
        },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback not found.",
        },
        { status: 404 }
      );
    }

    feedback.status = status;
    feedback.adminNote = adminNote;
    feedback.reviewedBy = session.user.id;
    feedback.reviewedAt = new Date();

    if (status === "resolved") {
      feedback.resolvedAt = new Date();
    } else {
      feedback.resolvedAt = null;
    }

    await feedback.save();

    const updatedFeedback = await Feedback.findById(feedback._id)
      .populate("user", "name email phone")
      .populate("reviewedBy", "name email")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Feedback updated successfully.",
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error("ADMIN FEEDBACK PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update feedback.",
      },
      { status: 500 }
    );
  }
}