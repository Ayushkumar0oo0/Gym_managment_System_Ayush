import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Feedback from "@/models/Feedback";

const ALLOWED_CATEGORIES = [
  "equipment_issue",
  "staff_complaint",
  "member_complaint",
  "cleanliness",
  "product_recommendation",
  "new_equipment_request",
  "suggestion",
  "other",
];

const MAX_SUBMISSIONS_PER_DAY = 5;

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to submit feedback.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only gym members can submit feedback.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    const category = String(body.category || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const productName = String(body.productName || "").trim();

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid feedback category.",
        },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a subject.",
        },
        { status: 400 }
      );
    }

    if (subject.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject cannot exceed 100 characters.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Please describe your feedback or request.",
        },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message cannot exceed 1000 characters.",
        },
        { status: 400 }
      );
    }

    if (productName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name cannot exceed 100 characters.",
        },
        { status: 400 }
      );
    }

    // Prevent accidental/repeated spam submissions.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const submissionsToday = await Feedback.countDocuments({
      user: session.user.id,
      createdAt: { $gte: startOfDay },
    });

    if (submissionsToday >= MAX_SUBMISSIONS_PER_DAY) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You have reached today's feedback limit. Please try again tomorrow.",
        },
        { status: 429 }
      );
    }

    const feedback = await Feedback.create({
      user: session.user.id,
      category,
      subject,
      message,
      productName,
      status: "new",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your feedback has been submitted successfully.",
        feedback: {
          id: feedback._id,
          category: feedback.category,
          subject: feedback.subject,
          status: feedback.status,
          createdAt: feedback.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("MEMBER FEEDBACK POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit feedback. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only gym members can access this page.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const feedback = await Feedback.find({
      user: session.user.id,
    })
      .sort({ createdAt: -1 })
      .select(
        "category subject message productName status adminNote createdAt reviewedAt resolvedAt"
      )
      .lean();

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("MEMBER FEEDBACK GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load your feedback.",
      },
      { status: 500 }
    );
  }
}