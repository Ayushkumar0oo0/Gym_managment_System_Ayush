
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        Number.parseInt(
          searchParams.get("limit") || String(DEFAULT_LIMIT),
          10
        ) || DEFAULT_LIMIT
      )
    );

    const search = (searchParams.get("search") || "").trim();

    await connectDB();

    const filter = { role: "member" };

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Count all matching members for accurate pagination and totals.
    const total = await User.countDocuments(filter);

    const members = await User.find(filter)
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
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (members.length === 0) {
      return NextResponse.json({
        success: true,
        members: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      });
    }

    // Fetch memberships only for the members on this page.
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

    const membershipsByUser = new Map();

    for (const membership of memberships) {
      const userIds = [];

      if (membership.user) {
        userIds.push(String(membership.user._id || membership.user));
      }

      if (membership.secondaryUser) {
        userIds.push(
          String(
            membership.secondaryUser._id ||
              membership.secondaryUser
          )
        );
      }

      for (const userId of userIds) {
        if (!membershipsByUser.has(userId)) {
          membershipsByUser.set(userId, []);
        }

        membershipsByUser.get(userId).push(membership);
      }
    }

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
          Math.ceil(difference / (1000 * 60 * 60 * 24))
        );
      }

      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        isActive: member.isActive,
        role: member.role,
        createdAt: member.createdAt,

        registrationFeePaid: member.registrationFeePaid,
        registrationFeePaidAt: member.registrationFeePaidAt,
        registrationFeeWaived: member.registrationFeeWaived,

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
              membershipType: activeMembership.membershipType,
              startDate: activeMembership.startDate,
              endDate: activeMembership.endDate,
              status: activeMembership.status,
              priceAtPurchase: activeMembership.priceAtPurchase,
              daysRemaining,
              selectedAddOns: activeMembership.selectedAddOns || [],
            }
          : null,

        membershipCount: memberMemberships.length,
      };
    });

    return NextResponse.json({
      success: true,
      members: membersWithMembership,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("GET ADMIN MEMBERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load members.",
      },
      { status: 500 }
    );
  }
}
