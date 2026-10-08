import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";
import Payment from "@/models/Payment";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
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
      error: NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}

export async function GET(request, { params }) {
  try {
    const authResult = await requireAdmin();

    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Member ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // ========================================
    // MEMBER
    // ========================================

    const member = await User.findOne({
      _id: id,
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
      .lean();

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Member not found.",
        },
        { status: 404 }
      );
    }

    // ========================================
    // MEMBERSHIP HISTORY
    // ========================================

    const memberships = await Membership.find({
      $or: [
        { user: member._id },
        { secondaryUser: member._id },
      ],
    })
      .populate(
        "plan",
        "name price durationInDays"
      )
      .populate(
        "secondaryUser",
        "name email phone"
      )
      .sort({ startDate: -1 })
      .lean();

    // ========================================
    // CURRENT MEMBERSHIP
    // ========================================

    const now = new Date();

    const currentMembership =
      memberships.find(
        (membership) =>
          membership.status === "active" &&
          membership.endDate &&
          new Date(membership.endDate) >= now
      ) || null;

    // ========================================
    // DAYS REMAINING
    // ========================================

    let daysRemaining = null;

    if (currentMembership?.endDate) {
      const difference =
        new Date(
          currentMembership.endDate
        ).getTime() - now.getTime();

      daysRemaining = Math.max(
        0,
        Math.ceil(
          difference /
            (1000 * 60 * 60 * 24)
        )
      );
    }

    // ========================================
    // FORMAT MEMBERSHIPS
    // ========================================

    const formattedMemberships =
      memberships.map((membership) => {
        let membershipDaysRemaining = null;

        if (membership.endDate) {
          const difference =
            new Date(
              membership.endDate
            ).getTime() - now.getTime();

          membershipDaysRemaining = Math.max(
            0,
            Math.ceil(
              difference /
                (1000 * 60 * 60 * 24)
            )
          );
        }

        return {
          _id: membership._id,

          plan: membership.plan,

          membershipType:
            membership.membershipType,

          coupleStatus:
            membership.coupleStatus,

          secondaryUser:
            membership.secondaryUser || null,

          selectedAddOns:
            membership.selectedAddOns || [],

          startDate:
            membership.startDate,

          endDate:
            membership.endDate,

          status:
            membership.status,

          priceAtPurchase:
            membership.priceAtPurchase,

          daysRemaining:
            membershipDaysRemaining,

          extensions:
            membership.extensions || [],

          createdAt:
            membership.createdAt,

          updatedAt:
            membership.updatedAt,
        };
      });

    // ========================================
    // PAYMENT HISTORY
    // ========================================

    const membershipIds =
      memberships.map(
        (membership) => membership._id
      );

    const payments = await Payment.find({
      $or: [
        { user: member._id },
        {
          membership: {
            $in: membershipIds,
          },
        },
      ],
    })
      .populate(
        "membershipPlan",
        "name price durationInDays"
      )
      .populate(
        "promotion",
        "title offerPrice type"
      )
      .populate(
        "recordedBy",
        "name email"
      )
      .populate(
        "receivedBy",
        "name email"
      )
      .populate(
        "membership",
        "startDate endDate status priceAtPurchase"
      )
      .sort({ createdAt: -1 })
      .lean();

    // ========================================
    // RESPONSE
    // ========================================

    return NextResponse.json({
      success: true,

      member: {
        _id: member._id,

        name: member.name,

        email: member.email,

        phone: member.phone,

        isActive: member.isActive,

        createdAt: member.createdAt,

        registration: {
          paid:
            member.registrationFeePaid,

          paidAt:
            member.registrationFeePaidAt,

          waived:
            member.registrationFeeWaived,
        },

        emergencyContact: {
          name:
            member.emergencyContactName || "",

          phone:
            member.emergencyContactPhone || "",

          relation:
            member.emergencyContactRelation || "",
        },
      },

      currentMembership:
        currentMembership
          ? {
              _id:
                currentMembership._id,

              plan:
                currentMembership.plan,

              membershipType:
                currentMembership.membershipType,

              coupleStatus:
                currentMembership.coupleStatus,

              secondaryUser:
                currentMembership.secondaryUser ||
                null,

              selectedAddOns:
                currentMembership.selectedAddOns ||
                [],

              startDate:
                currentMembership.startDate,

              endDate:
                currentMembership.endDate,

              status:
                currentMembership.status,

              priceAtPurchase:
                currentMembership.priceAtPurchase,

              daysRemaining,

              extensions:
                currentMembership.extensions ||
                [],
            }
          : null,

      memberships:
        formattedMemberships,

      payments,
    });
  } catch (error) {
    console.error(
      "GET MEMBER DETAILS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to load member details.",
      },
      { status: 500 }
    );
  }
}