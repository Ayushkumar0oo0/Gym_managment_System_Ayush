import { NextResponse } from "next/server";
import MembershipPlan from "@/models/MembershipPlan";
import Promotion from "@/models/Promotion";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import PurchaseOrder from "@/models/PurchaseOrder";

import {
  adminRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function GET(request) {
  try {
    // ==================================================
    // 1. AUTHENTICATION
    // ==================================================

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ==================================================
    // 2. ADMIN ACCESS
    // ==================================================

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ==================================================
    // 3. ADMIN RATE LIMIT
    // ==================================================

    const adminId = session.user.id;
    const clientIp = getClientIp(request);

    const rateLimitResult =
      await adminRateLimit.limit(
        createRateLimitIdentifier(
          "admin-purchase-requests",
          `${adminId}:${clientIp}`
        )
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(
        rateLimitResult
      );
    }

    // ==================================================
    // 4. DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 5. FETCH PENDING CASH PURCHASES
    // ==================================================

    /*
     * IMPORTANT:
     *
     * Cash purchase requests do NOT have an automatic
     * expiration time.
     *
     * The customer may submit the request and pay at
     * the gym later. The admin manually confirms the
     * cash payment.
     *
     * Therefore we intentionally DO NOT run any
     * expiration update here.
     */

    const purchaseOrders =
      await PurchaseOrder.find({
        paymentMethod: "cash",
        status: "cash_pending",
      })
        .select(
          [
            "_id",
            "orderNumber",

            // Customer
            "name",
            "email",
            "phone",
            "gender",

            // Emergency contact
            "emergencyContactName",
            "emergencyContactPhone",
            "emergencyContactRelation",

            // Membership
            "membershipPlan",
            "membershipType",
            "partner",
            "selectedAddOns",

            // Promotion
            "promotion",

            // Pricing
            "membershipPrice",
            "addOnsTotal",
            "registrationFee",
            "discount",
            "totalAmount",

            // Payment/order state
            "paymentMethod",
            "status",
            "createdAt",
            "expiresAt",
          ].join(" ")
        )
        .populate({
          path: "membershipPlan",
          select:
            "name description price durationInDays eligibility features isActive",
        })
        .populate({
          path: "promotion",
          select:
            "title description type offerPrice registrationFeeWaived extensionDays startDate endDate isActive",
        })
        .sort({
          createdAt: -1,
        })
        .lean();

    // ==================================================
    // 6. RETURN RESULTS
    // ==================================================

    return NextResponse.json(
      {
        success: true,
        purchaseOrders,
      },
      {
        status: 200,
      }
    );
   } catch (error) {
  console.error("ADMIN PURCHASE REQUESTS GET ERROR:", {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
  });

  return NextResponse.json(
    {
      success: false,
      message: "Unable to load purchase requests.",
    },
    { status: 500 }
  );
}
}