import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";


// =====================================================
// GET NOTIFICATIONS
// =====================================================

export async function GET() {
  try {
    // --------------------------------
    // Authentication
    // --------------------------------

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

    // --------------------------------
    // Database
    // --------------------------------

    await connectDB();

    // --------------------------------
    // Get notifications
    // --------------------------------

    const notifications =
      await Notification.find({
        user: session.user.id,
      })
        .populate(
          "productOrder",
          "_id orderStatus totalAmount remainingAmount"
        )
        .sort({
          createdAt: -1,
        })
        .limit(50)
        .lean();

    // --------------------------------
    // Count unread
    // --------------------------------

    const unreadCount =
      await Notification.countDocuments({
        user: session.user.id,
        isRead: false,
      });

    return NextResponse.json(
      {
        success: true,

        notifications,

        unreadCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load notifications.",
      },
      { status: 500 }
    );
  }
}


// =====================================================
// MARK NOTIFICATION AS READ
// =====================================================

export async function PATCH(request) {
  try {
    // --------------------------------
    // Authentication
    // --------------------------------

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

    // --------------------------------
    // Read request
    // --------------------------------

    const body = await request.json();

    const notificationId =
      body?.notificationId;

    const markAll =
      body?.markAll === true;

    await connectDB();

    // --------------------------------
    // Mark ALL as read
    // --------------------------------

    if (markAll) {
      const result =
        await Notification.updateMany(
          {
            user: session.user.id,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          }
        );

      return NextResponse.json(
        {
          success: true,

          message:
            "All notifications marked as read.",

          modifiedCount:
            result.modifiedCount,
        },
        { status: 200 }
      );
    }

    // --------------------------------
    // Single notification
    // --------------------------------

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification ID is required.",
        },
        { status: 400 }
      );
    }

    const notification =
      await Notification.findOne({
        _id: notificationId,
        user: session.user.id,
      });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification not found.",
        },
        { status: 404 }
      );
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    return NextResponse.json(
      {
        success: true,

        message:
          "Notification marked as read.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH NOTIFICATIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update notification.",
      },
      { status: 500 }
    );
  }
}