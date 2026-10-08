import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import { createNotification } from "@/lib/notifications";


// ==========================================
// GET - Get all memberships
// ==========================================

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (session.user?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const memberships = await Membership.find()
      .populate("user", "name email phone")
      .populate(
        "plan",
        "name price durationInDays"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      memberships,
    });
  } catch (error) {
    console.error(
      "Get memberships error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}


// ==========================================
// POST - Create membership
// ==========================================

export async function POST(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (session.user?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      userId,
      planId,
      startDate,
    } = body;

    // Validate required fields

    if (!userId || !planId || !startDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User, plan and start date are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Make sure this is actually a member

    if (user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Membership can only be assigned to members",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // FIND PLAN
    // ==========================================

    const plan = await MembershipPlan.findById(
      planId
    );

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership plan not found",
        },
        { status: 404 }
      );
    }

    // Don't allow inactive plans

    if (!plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This membership plan is inactive",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // VALIDATE START DATE
    // ==========================================

    const membershipStartDate = new Date(
      startDate
    );

    if (
      Number.isNaN(
        membershipStartDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid start date",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CALCULATE END DATE
    // ==========================================

    const membershipEndDate = new Date(
      membershipStartDate
    );

    membershipEndDate.setDate(
      membershipEndDate.getDate() +
        plan.durationInDays
    );

    // ==========================================
    // CHECK OVERLAPPING MEMBERSHIP
    // ==========================================

    const overlappingMembership =
      await Membership.findOne({
        user: user._id,
        status: "active",
        startDate: {
          $lt: membershipEndDate,
        },
        endDate: {
          $gt: membershipStartDate,
        },
      });

    if (overlappingMembership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This member already has an active membership during this period",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // CREATE MEMBERSHIP
    // ==========================================

    const membership =
      await Membership.create({
        user: user._id,
        plan: plan._id,
        startDate: membershipStartDate,
        endDate: membershipEndDate,
        status: "active",
        priceAtPurchase: plan.price,
      });

    try {
      await createNotification({
        user: user._id,
        type: "membership",
        title: "Membership Activated",
        message: `Your ${plan.name} membership has been activated successfully. Your membership is valid until ${membershipEndDate.toLocaleDateString(
          "en-IN"
        )}.`,
        link: "/dashboard",
      });
    } catch (notificationError) {
      console.error(
        "CREATE MEMBERSHIP NOTIFICATION ERROR:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Membership created successfully",
        membership,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create membership error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}