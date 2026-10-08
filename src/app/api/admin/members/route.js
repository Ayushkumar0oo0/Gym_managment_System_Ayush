import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
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
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    await connectDB();

    // --------------------------------------------------
    // 1. Get all members
    // --------------------------------------------------

    const members = await User.find({
      role: "member",
    })
      .select(
        [
          "name",
          "email",
          "phone",
          "isActive",
          "createdAt",
          "registrationFeePaid",
          "registrationFeePaidAt",
          "registrationFeeWaived",
          "emergencyContactName",
          "emergencyContactPhone",
          "emergencyContactRelation",
        ].join(" ")
      )
      .sort({ createdAt: -1 })
      .lean();

    if (members.length === 0) {
      return NextResponse.json({
        success: true,
        members: [],
      });
    }

    // --------------------------------------------------
    // 2. Get memberships
    // --------------------------------------------------

    const memberIds = members.map((member) => member._id);

    const memberships = await Membership.find({
      $or: [
        { user: { $in: memberIds } },
        { secondaryUser: { $in: memberIds } },
      ],
    })
      .populate("plan", "name price durationInDays")
      .sort({ startDate: -1 })
      .lean();

    // --------------------------------------------------
    // 3. Group memberships by user
    // --------------------------------------------------

    const membershipsByUser = new Map();

    for (const membership of memberships) {
      const userIds = [];

      if (membership.user) {
        userIds.push(String(membership.user));
      }

      if (membership.secondaryUser) {
        userIds.push(String(membership.secondaryUser));
      }

      for (const userId of userIds) {
        if (!membershipsByUser.has(userId)) {
          membershipsByUser.set(userId, []);
        }

        membershipsByUser.get(userId).push(membership);
      }
    }

    // --------------------------------------------------
    // 4. Build member response
    // --------------------------------------------------

    const now = new Date();

    const membersWithMembership = members.map((member) => {
      const memberMemberships =
        membershipsByUser.get(String(member._id)) || [];

      const activeMembership =
        memberMemberships.find(
          (membership) =>
            membership.status === "active" &&
            membership.endDate &&
            new Date(membership.endDate) >= now
        ) || null;

      let daysRemaining = null;

      if (activeMembership?.endDate) {
        const difference =
          new Date(activeMembership.endDate).getTime() -
          now.getTime();

        daysRemaining = Math.max(
          0,
          Math.ceil(
            difference / (1000 * 60 * 60 * 24)
          )
        );
      }

      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        isActive: member.isActive,
        createdAt: member.createdAt,

        registration: {
          paid: member.registrationFeePaid,
          paidAt: member.registrationFeePaidAt,
          waived: member.registrationFeeWaived,
        },

        emergencyContact: {
          name: member.emergencyContactName || "",
          phone: member.emergencyContactPhone || "",
          relation: member.emergencyContactRelation || "",
        },

        membership: activeMembership
          ? {
              _id: activeMembership._id,
              plan: activeMembership.plan,
              membershipType:
                activeMembership.membershipType,
              startDate: activeMembership.startDate,
              endDate: activeMembership.endDate,
              status: activeMembership.status,
              priceAtPurchase:
                activeMembership.priceAtPurchase,
              daysRemaining,
              selectedAddOns:
                activeMembership.selectedAddOns || [],
            }
          : null,

        membershipCount: memberMemberships.length,
      };
    });

    // --------------------------------------------------
    // 5. Return response
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      members: membersWithMembership,
    });
  } catch (error) {
    console.error("GET ADMIN MEMBERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || "Failed to load members.",
      },
      { status: 500 }
    );
  }
}