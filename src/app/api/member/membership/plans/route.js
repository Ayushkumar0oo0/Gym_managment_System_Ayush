import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import MembershipPlan from "@/models/MembershipPlan";

export async function GET() {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const session = await auth();

    console.log("========== MEMBER PLANS DEBUG ==========");
    console.log("SESSION USER:", session?.user);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // MEMBER ACCESS
    // ==========================================

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only members can view membership plans.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // FIND CURRENT USER
    // ==========================================

    const user = await User.findById(session.user.id)
      .select("gender isActive email")
      .lean();

    console.log("DATABASE USER:", user);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // DEBUG: GET ALL ACTIVE PLANS
    // ==========================================

    const allActivePlans = await MembershipPlan.find({
      isActive: true,
    })
      .select("_id name eligibility isActive")
      .lean();

    console.log("ALL ACTIVE PLANS:", allActivePlans);

    // ==========================================
    // GET ELIGIBLE ACTIVE PLANS
    // ==========================================

    const plans = await MembershipPlan.find({
      isActive: true,
      $or: [
        {
          eligibility: "both",
        },
        {
          eligibility: user.gender,
        },
      ],
    })
      .select(
        "_id name description price durationInDays features eligibility"
      )
      .sort({
        durationInDays: 1,
      })
      .lean();

    // ==========================================
    // DEBUG RESULTS
    // ==========================================

    console.log("USER GENDER:", user.gender);
    console.log("FILTERED PLANS:", plans);
    console.log("========================================");

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        plans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET MEMBERSHIP PLANS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to fetch membership plans.",
      },
      { status: 500 }
    );
  }
}