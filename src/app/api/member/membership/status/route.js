import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Membership from "@/models/Membership";
import Payment from "@/models/Payment";
import MembershipPlan from "@/models/MembershipPlan";
import User from "@/models/User";

import {
  paymentRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function GET(request) {
  try {
    // =========================================================
    // 1. AUTHENTICATION
    // =========================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only members can access membership status.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 2. RATE LIMIT
    // =========================================================

    const clientIp = getClientIp(request);

    const identifier = createRateLimitIdentifier(
      "membership-status",
      `${session.user.id}:${clientIp}`
    );

    const rateLimitResult =
      await paymentRateLimit.limit(identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // =========================================================
    // 3. VALIDATE USER ID
    // =========================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        session.user.id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user session.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // =========================================================
    // 4. LOAD USER
    // =========================================================

    const user = await User.findById(
      session.user.id
    )
      .select(
        "_id name email role gender isActive"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    if (user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only members can access membership status.",
        },
        { status: 403 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 5. FIND CURRENT MEMBERSHIP
    // =========================================================

    const membership =
      await Membership.findOne({
        $or: [
          { user: user._id },
          { secondaryUser: user._id },
        ],
        status: {
          $in: ["active", "expired"],
        },
      })
        .sort({
          endDate: -1,
          updatedAt: -1,
        })
        .populate({
          path: "plan",
          model: MembershipPlan,
          select:
            "name description durationInDays price features eligibility isActive",
        })
        .populate({
          path: "user",
          model: User,
          select: "_id name email gender",
        })
        .populate({
          path: "secondaryUser",
          model: User,
          select: "_id name email gender",
        })
        .lean();

    // =========================================================
    // 6. CALCULATE PENDING RENEWAL EVEN IF NO MEMBERSHIP
    // =========================================================

    const pendingRenewal =
      await Payment.findOne({
        user: user._id,
        paymentType: "renewal",
        status: "pending",
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "membershipPlan",
          model: MembershipPlan,
          select:
            "name description durationInDays price features eligibility isActive",
        })
        .lean();

    // =========================================================
    // 7. FORMAT PENDING RENEWAL
    // =========================================================

    let formattedPendingRenewal = null;

    if (pendingRenewal) {
      formattedPendingRenewal = {
        id: pendingRenewal._id.toString(),

        amount: Number(
          pendingRenewal.amount || 0
        ),

        method: pendingRenewal.method || null,

        status:
          pendingRenewal.status || "pending",

        paymentType:
          pendingRenewal.paymentType || "renewal",

        transactionId:
          pendingRenewal.transactionId || null,

        gatewayOrderId:
          pendingRenewal.gatewayOrderId || null,

        gatewayPaymentId:
          pendingRenewal.gatewayPaymentId || null,

        createdAt:
          pendingRenewal.createdAt || null,

        membershipStartDate:
          pendingRenewal.membershipStartDate ||
          null,

        // Keep BOTH _id and id so all frontend
        // components can reliably identify the plan.
        plan: pendingRenewal.membershipPlan
          ? {
              _id:
                pendingRenewal.membershipPlan._id.toString(),

              id:
                pendingRenewal.membershipPlan._id.toString(),

              name:
                pendingRenewal.membershipPlan.name,

              description:
                pendingRenewal.membershipPlan
                  .description || "",

              durationInDays:
                pendingRenewal.membershipPlan
                  .durationInDays,

              price: Number(
                pendingRenewal.membershipPlan.price ||
                  0
              ),

              features:
                pendingRenewal.membershipPlan
                  .features || [],

              eligibility:
                pendingRenewal.membershipPlan
                  .eligibility || "both",

              isActive:
                pendingRenewal.membershipPlan
                  .isActive !== false,
            }
          : null,
      };
    }

    // =========================================================
    // 8. NO MEMBERSHIP
    // =========================================================

    if (!membership) {
      return NextResponse.json(
        {
          success: true,

          membership: null,

          pendingRenewal:
            formattedPendingRenewal,

          pendingExtension: null,

          payments: [],
        },
        { status: 200 }
      );
    }

    // =========================================================
    // 9. CALCULATE MEMBERSHIP STATUS
    // =========================================================

    const now = new Date();

    const startDate = membership.startDate
      ? new Date(membership.startDate)
      : null;

    const endDate = membership.endDate
      ? new Date(membership.endDate)
      : null;

    let calculatedStatus =
      membership.status;

    if (endDate && now >= endDate) {
      calculatedStatus = "expired";
    } else if (
      startDate &&
      now < startDate
    ) {
      calculatedStatus = "upcoming";
    } else {
      calculatedStatus = "active";
    }

    // =========================================================
    // 10. CALCULATE REMAINING DAYS
    // =========================================================

    let remainingDays = 0;

    if (endDate && now < endDate) {
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

    // =========================================================
    // 11. FIND PENDING EXTENSION
    // =========================================================

    const pendingExtension =
      await Payment.findOne({
        user: user._id,
        membership: membership._id,
        paymentType: "promotion",
        status: "pending",
      })
        .sort({ createdAt: -1 })
        .lean();

    const formattedPendingExtension =
      pendingExtension
        ? {
            id:
              pendingExtension._id.toString(),

            amount: Number(
              pendingExtension.amount || 0
            ),

            method:
              pendingExtension.method || null,

            status:
              pendingExtension.status ||
              "pending",

            createdAt:
              pendingExtension.createdAt ||
              null,

            promotion:
              pendingExtension.promotion
                ? pendingExtension.promotion.toString()
                : null,
          }
        : null;

    // =========================================================
    // 12. PAYMENT HISTORY
    // =========================================================

    const paymentHistory =
      await Payment.find({
        user: user._id,

        $or: [
          {
            membership:
              membership._id,
          },
          {
            membershipPlan:
              membership.plan?._id,
          },
        ],
      })
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .select(
          "_id amount method status paymentType transactionId gatewayPaymentId paidAt createdAt membershipStartDate notes"
        )
        .lean();

    const formattedPayments =
      paymentHistory.map(
        (payment) => ({
          _id:
            payment._id.toString(),

          amount: Number(
            payment.amount || 0
          ),

          method:
            payment.method || null,

          status:
            payment.status || "pending",

          paymentType:
            payment.paymentType || "other",

          transactionId:
            payment.transactionId || null,

          gatewayPaymentId:
            payment.gatewayPaymentId ||
            null,

          paidAt:
            payment.paidAt || null,

          createdAt:
            payment.createdAt || null,

          membershipStartDate:
            payment.membershipStartDate ||
            null,

          notes:
            payment.notes || "",
        })
      );

    // =========================================================
    // 13. FORMAT EXTENSION HISTORY
    // =========================================================

    const extensions =
      Array.isArray(
        membership.extensions
      )
        ? membership.extensions.map(
            (extension) => ({
              id:
                extension._id?.toString(),

              daysAdded: Number(
                extension.daysAdded || 0
              ),

              oldEndDate:
                extension.oldEndDate ||
                null,

              newEndDate:
                extension.newEndDate ||
                null,

              reason:
                extension.reason || "",

              source:
                extension.source ||
                "admin",

              promotion:
                extension.promotion
                  ? extension.promotion.toString()
                  : null,

              payment:
                extension.payment
                  ? extension.payment.toString()
                  : null,

              approvedBy:
                extension.approvedBy
                  ? extension.approvedBy.toString()
                  : null,

              createdAt:
                extension.createdAt ||
                null,

              updatedAt:
                extension.updatedAt ||
                null,
            })
          )
        : [];

    // =========================================================
    // 14. FORMAT PLAN
    // =========================================================

    const formattedPlan =
      membership.plan
        ? {
            _id:
              membership.plan._id.toString(),

            id:
              membership.plan._id.toString(),

            name:
              membership.plan.name,

            description:
              membership.plan.description ||
              "",

            durationInDays:
              membership.plan.durationInDays,

            price: Number(
              membership.plan.price || 0
            ),

            features:
              membership.plan.features ||
              [],

            eligibility:
              membership.plan.eligibility ||
              "both",

            isActive:
              membership.plan.isActive !==
              false,
          }
        : null;

    // =========================================================
    // 15. FORMAT SELECTED ADD-ONS
    // =========================================================

    const selectedAddOns =
      Array.isArray(
        membership.selectedAddOns
      )
        ? membership.selectedAddOns.map(
            (addOn) => ({
              addOn:
                addOn.addOn?._id?.toString() ||
                addOn.addOn?.toString() ||
                null,

              name:
                addOn.name || "",

              price: Number(
                addOn.price || 0
              ),

              quantity: Number(
                addOn.quantity || 1
              ),
            })
          )
        : [];

    // =========================================================
    // 16. DETERMINE MEMBER POSITION
    // =========================================================

    let memberPosition = "primary";

    if (
      membership.secondaryUser &&
      membership.secondaryUser._id?.toString() ===
        user._id.toString()
    ) {
      memberPosition = "secondary";
    }

    // =========================================================
    // 17. FINAL MEMBERSHIP RESPONSE
    // =========================================================

    const responseMembership = {
      id:
        membership._id.toString(),

      user:
        membership.user?._id?.toString() ||
        membership.user?.toString() ||
        null,

      secondaryUser:
        membership.secondaryUser?._id?.toString() ||
        membership.secondaryUser?.toString() ||
        null,

      memberPosition,

      membershipType:
        membership.membershipType ||
        "individual",

      coupleStatus:
        membership.coupleStatus || null,

      plan: formattedPlan,

      selectedAddOns,

      startDate:
        membership.startDate || null,

      endDate:
        membership.endDate || null,

      status: calculatedStatus,

      remainingDays,

      priceAtPurchase: Number(
        membership.priceAtPurchase || 0
      ),

      extensions,

      createdAt:
        membership.createdAt || null,

      updatedAt:
        membership.updatedAt || null,
    };

    // =========================================================
    // 18. RETURN
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        membership:
          responseMembership,

        pendingRenewal:
          formattedPendingRenewal,

        pendingExtension:
          formattedPendingExtension,

        payments:
          formattedPayments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBERSHIP STATUS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to load membership status.",
      },
      { status: 500 }
    );
  }
}