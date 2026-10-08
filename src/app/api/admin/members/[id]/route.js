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

    const payments = await Payment.find({
      $or: [
        { user: member._id },
        {
          membership: {
            $in: memberships.map(
              (membership) => membership._id
            ),
          },
        },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    const currentMembership =
      memberships.find(
        (membership) =>
          membership.status === "active" &&
          membership.endDate &&
          new Date(membership.endDate) >= now
      ) || null;

    let daysRemaining = null;

    if (currentMembership?.endDate) {
      const difference =
        new Date(currentMembership.endDate).getTime() -
        now.getTime();

      daysRemaining = Math.max(
        0,
        Math.ceil(
          difference / (1000 * 60 * 60 * 24)
        )
      );
    }

    const formattedMemberships = memberships.map(
      (membership) => {
        let membershipDaysRemaining = null;

        if (membership.endDate) {
          const difference =
            new Date(membership.endDate).getTime() -
            now.getTime();

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
          startDate: membership.startDate,
          endDate: membership.endDate,
          status: membership.status,
          priceAtPurchase:
            membership.priceAtPurchase,
          daysRemaining:
            membershipDaysRemaining,
          extensions:
            membership.extensions || [],
          createdAt: membership.createdAt,
        };
      }
    );

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
          paid: member.registrationFeePaid,
          paidAt: member.registrationFeePaidAt,
          waived: member.registrationFeeWaived,
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

      currentMembership: currentMembership
        ? {
            _id: currentMembership._id,
            plan: currentMembership.plan,
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
              currentMembership.extensions || [],
          }
        : null,

      memberships: formattedMemberships,

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

export async function PATCH(request, { params }) {
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

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "isActive",
    ];

    const hasAllowedField =
      Object.keys(body).some((field) =>
        allowedFields.includes(field)
      );

    if (!hasAllowedField) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid fields were provided for update.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const member = await User.findOne({
      _id: id,
      role: "member",
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Member not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------
    // NAME
    // ----------------------------------------

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be a string.",
          },
          { status: 400 }
        );
      }

      const name = body.name.trim();

      if (name.length < 2 || name.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Name must contain between 2 and 100 characters.",
          },
          { status: 400 }
        );
      }

      member.name = name;
    }

    // ----------------------------------------
    // EMAIL
    // ----------------------------------------

    if (body.email !== undefined) {
      if (typeof body.email !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Email must be a string.",
          },
          { status: 400 }
        );
      }

      const email = body.email
        .trim()
        .toLowerCase();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter a valid email address.",
          },
          { status: 400 }
        );
      }

      const existingEmail =
        await User.findOne({
          email,
          _id: { $ne: member._id },
        }).select("_id");

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another account already uses this email.",
          },
          { status: 409 }
        );
      }

      member.email = email;
    }

    // ----------------------------------------
    // PHONE
    // ----------------------------------------

    if (body.phone !== undefined) {
      if (typeof body.phone !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Phone must be a string.",
          },
          { status: 400 }
        );
      }

      const phone = body.phone.trim();

      if (!/^[0-9]{10}$/.test(phone)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Phone number must contain exactly 10 digits.",
          },
          { status: 400 }
        );
      }

      const existingPhone =
        await User.findOne({
          phone,
          _id: { $ne: member._id },
        }).select("_id");

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another account already uses this phone number.",
          },
          { status: 409 }
        );
      }

      member.phone = phone;
    }

    // ----------------------------------------
    // ACTIVE STATUS
    // ----------------------------------------

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message:
              "isActive must be true or false.",
          },
          { status: 400 }
        );
      }

      member.isActive = body.isActive;
    }

    await member.save();

    return NextResponse.json({
      success: true,
      message: "Member updated successfully.",
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        isActive: member.isActive,
        createdAt: member.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE MEMBER ERROR:",
      error
    );

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email or phone number is already in use.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to update member.",
      },
      { status: 500 }
    );
  }
}