import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";

export async function GET() {
  try {
    // ---------------------------------
    // Check authentication
    // ---------------------------------

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

    // ---------------------------------
    // Only members
    // ---------------------------------

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------
    // Connect MongoDB
    // ---------------------------------

    await connectDB();

    // ---------------------------------
    // Get member
    // ---------------------------------

    const user = await User.findById(
      session.user.id
    )
      .select(
        "name email phone registrationFeePaid registrationFeePaidAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Member account not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------
    // Get current membership
    // ---------------------------------

    const membership =
      await Membership.findOne({
        user: session.user.id,

        status: "active",

        endDate: {
          $gte: new Date(),
        },
      })
        .populate(
          "plan",
          "name description price durationInDays features"
        )
        .sort({
          endDate: -1,
        })
        .lean();

    // ---------------------------------
    // Calculate remaining days
    // ---------------------------------

    let remainingDays = 0;

    if (membership) {
      const now = new Date();

      const endDate =
        new Date(membership.endDate);

      const difference =
        endDate.getTime() -
        now.getTime();

      remainingDays = Math.max(
        0,
        Math.ceil(
          difference /
            (1000 * 60 * 60 * 24)
        )
      );
    }

    // ---------------------------------
    // Return dashboard data
    // ---------------------------------

    return NextResponse.json(
      {
        success: true,

        member: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,

          registrationFeePaid:
            user.registrationFeePaid,

          registrationFeePaidAt:
            user.registrationFeePaidAt,
        },

        membership: membership
          ? {
              id: membership._id.toString(),

              startDate:
                membership.startDate,

              endDate:
                membership.endDate,

              status:
                membership.status,

              priceAtPurchase:
                membership.priceAtPurchase,

              remainingDays,

              plan: membership.plan,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER DASHBOARD GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load dashboard data.",
      },
      { status: 500 }
    );
  }
}