import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

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

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only members can access this page.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // FIND CURRENT MEMBERSHIP
    // ==========================================

    const membership = await Membership.findOne({
      $or: [
        { user: session.user.id },
        { secondaryUser: session.user.id },
      ],
      status: {
        $in: ["active", "expired"],
      },
    })
      .populate(
        "plan",
        "name description price durationInDays features eligibility"
      )
      .populate(
        "user",
        "name email gender"
      )
      .populate(
        "secondaryUser",
        "name email gender"
      )
      .populate(
        "extensions.approvedBy",
        "name email"
      )
      .populate(
        "extensions.promotion",
        "title type offerPrice extensionDays"
      )
      .sort({
        endDate: -1,
      })
      .lean();

    // ==========================================
    // NO MEMBERSHIP
    // ==========================================

    if (!membership) {
      return NextResponse.json(
        {
          success: true,
          membership: null,
          message:
            "You do not have a membership.",
        },
        { status: 200 }
      );
    }

    // ==========================================
    // VALIDATE MEMBERSHIP DATES
    // ==========================================

    const now = new Date();

    const startDate = new Date(
      membership.startDate
    );

    const endDate = new Date(
      membership.endDate
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Membership has invalid date information.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // CALCULATE ACTUAL STATUS
    // ==========================================

    let membershipStatus;

    if (now < startDate) {
      membershipStatus = "upcoming";
    } else if (now >= endDate) {
      membershipStatus = "expired";
    } else {
      membershipStatus = "active";
    }

    // ==========================================
    // CALCULATE DAYS REMAINING
    // ==========================================

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    let daysRemaining = 0;

    if (membershipStatus === "active") {
      daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) /
          millisecondsPerDay
      );

      if (daysRemaining < 0) {
        daysRemaining = 0;
      }
    }

    // ==========================================
    // TOTAL EXTENSION DAYS
    // ==========================================

    const totalExtensionDays = (
      membership.extensions || []
    ).reduce(
      (total, extension) =>
        total +
        Number(extension.daysAdded || 0),
      0
    );

    // ==========================================
    // FORMAT EXTENSIONS
    // ==========================================

    const extensions = (
      membership.extensions || []
    ).map((extension) => ({
      id: extension._id,

      daysAdded:
        Number(extension.daysAdded || 0),

      oldEndDate:
        extension.oldEndDate || null,

      newEndDate:
        extension.newEndDate || null,

      reason:
        extension.reason || null,

      source:
        extension.source || null,

      payment:
        extension.payment
          ? extension.payment
          : null,

      promotion:
        extension.promotion
          ? {
              id: extension.promotion._id,

              title:
                extension.promotion.title,

              type:
                extension.promotion.type,

              offerPrice:
                extension.promotion.offerPrice,

              extensionDays:
                extension.promotion
                  .extensionDays,
            }
          : null,

      approvedBy:
        extension.approvedBy
          ? {
              id:
                extension.approvedBy._id,

              name:
                extension.approvedBy.name,

              email:
                extension.approvedBy.email ||
                null,
            }
          : null,

      createdAt:
        extension.createdAt || null,
    }));

    // ==========================================
    // DETERMINE MEMBER POSITION
    // ==========================================

    let memberPosition = "primary";

    if (
      membership.secondaryUser &&
      String(membership.secondaryUser._id) ===
        String(session.user.id)
    ) {
      memberPosition = "secondary";
    }

    // ==========================================
    // RETURN RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        membership: {
          id: membership._id,

          membershipType:
            membership.membershipType ||
            "individual",

          coupleStatus:
            membership.coupleStatus || null,

          memberPosition,

          status: membershipStatus,

          startDate:
            membership.startDate,

          endDate:
            membership.endDate,

          daysRemaining,

          priceAtPurchase:
            membership.priceAtPurchase,

          user: membership.user
            ? {
                id: membership.user._id,

                name:
                  membership.user.name,

                email:
                  membership.user.email,

                gender:
                  membership.user.gender,
              }
            : null,

          secondaryUser:
            membership.secondaryUser
              ? {
                  id:
                    membership.secondaryUser._id,

                  name:
                    membership.secondaryUser
                      .name,

                  email:
                    membership.secondaryUser
                      .email,

                  gender:
                    membership.secondaryUser
                      .gender,
                }
              : null,

          plan: membership.plan
            ? {
                id:
                  membership.plan._id,

                name:
                  membership.plan.name,

                description:
                  membership.plan.description,

                price:
                  membership.plan.price,

                durationInDays:
                  membership.plan
                    .durationInDays,

                features:
                  membership.plan.features,

                eligibility:
                  membership.plan
                    .eligibility,
              }
            : null,

          selectedAddOns:
            Array.isArray(
              membership.selectedAddOns
            )
              ? membership.selectedAddOns
              : [],

          extensions,

          totalExtensionDays,

          createdAt:
            membership.createdAt,

          updatedAt:
            membership.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER MEMBERSHIP GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to fetch membership.",
      },
      { status: 500 }
    );
  }
}