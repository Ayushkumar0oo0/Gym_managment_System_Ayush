import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";

export async function GET() {
  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

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

    // ==========================================
    // MEMBER ACCESS
    // ==========================================

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only members can access membership purchase information.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(
      session.user.id
    ).select(
      "name email phone registrationFeePaid registrationFeePaidAt isActive"
    );

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
    // CHECK ACTIVE MEMBERSHIP
    // ==========================================

    const now = new Date();

    const activeMembership =
      await Membership.findOne({
        $or: [
          {
            user: user._id,
          },
          {
            secondaryUser: user._id,
          },
        ],

        status: "active",

        endDate: {
          $gte: now,
        },
      })
        .select(
          "_id startDate endDate plan membershipType"
        )
        .populate(
          "plan",
          "name durationInDays"
        )
        .lean();

    // ==========================================
    // REGISTRATION FEE
    // ==========================================

    const registrationFeePaid =
      user.registrationFeePaid === true;

    const registrationFee =
      registrationFeePaid
        ? 0
        : 500;

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          registrationFeePaid,
          registrationFeePaidAt:
            user.registrationFeePaidAt ||
            null,
        },

        registrationFee,

        activeMembership:
          activeMembership
            ? {
                id: activeMembership._id,

                startDate:
                  activeMembership.startDate,

                endDate:
                  activeMembership.endDate,

                membershipType:
                  activeMembership.membershipType,

                plan:
                  activeMembership.plan
                    ? {
                        id:
                          activeMembership
                            .plan._id,

                        name:
                          activeMembership
                            .plan.name,

                        durationInDays:
                          activeMembership
                            .plan
                            .durationInDays,
                      }
                    : null,
              }
            : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBERSHIP PURCHASE INFO ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to load membership purchase information.",
      },
      { status: 500 }
    );
  }
}