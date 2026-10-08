import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import PurchaseOrder from "@/models/PurchaseOrder";
import { completePurchaseOrder } from "@/lib/completePurchaseOrder";

import {
  adminRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(request, { params }) {
  let session = null;

  try {
    // ==================================================
    // 1. AUTHENTICATION
    // ==================================================

    const authSession = await auth();

    if (!authSession?.user) {
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

    if (
      authSession.user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ==================================================
    // 3. ADMIN ID
    // ==================================================

    const adminId =
      authSession.user.id;

    if (!adminId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin identity could not be verified.",
        },
        { status: 401 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        adminId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid admin identity.",
        },
        { status: 401 }
      );
    }

    // ==================================================
    // 4. RATE LIMIT ADMIN ACTION
    // ==================================================

    const clientIp =
      getClientIp(request);

    const rateLimitResult =
      await adminRateLimit.limit(
        createRateLimitIdentifier(
          "admin-cash-purchase-confirm",
          `${adminId}:${clientIp}`
        )
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(
        rateLimitResult
      );
    }

    // ==================================================
    // 5. GET PURCHASE ORDER ID
    // ==================================================

    const resolvedParams =
      await params;

    const purchaseOrderId =
      resolvedParams?.id;

    if (!purchaseOrderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase order ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        purchaseOrderId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid purchase order ID.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 6. CONNECT DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 7. START TRANSACTION
    // ==================================================

    session =
      await mongoose.startSession();

    session.startTransaction();

    // ==================================================
    // 8. LOAD PURCHASE ORDER
    // ==================================================

    const purchaseOrder =
      await PurchaseOrder.findById(
        purchaseOrderId
      ).session(session);

    if (!purchaseOrder) {
      throw new Error(
        "Purchase order not found."
      );
    }

    // ==================================================
    // 9. VERIFY CASH PAYMENT
    // ==================================================

    if (
      purchaseOrder.paymentMethod !==
      "cash"
    ) {
      throw new Error(
        "Only cash purchase requests can be confirmed from this page."
      );
    }

    // ==================================================
    // 10. IDEMPOTENCY
    // ==================================================

    if (
      purchaseOrder.status ===
        "completed" &&
      purchaseOrder.user &&
      purchaseOrder.membership &&
      purchaseOrder.payment
    ) {
      await session.commitTransaction();

      return NextResponse.json(
        {
          success: true,
          message:
            "This purchase has already been completed.",

          purchaseOrder: {
            id:
              purchaseOrder._id.toString(),

            orderNumber:
              purchaseOrder.orderNumber,

            status:
              purchaseOrder.status,
          },
        },
        { status: 200 }
      );
    }

    // ==================================================
    // 11. MUST BE CASH PENDING
    // ==================================================

    if (
      purchaseOrder.status !==
      "cash_pending"
    ) {
      throw new Error(
        `Purchase order cannot be confirmed from status "${purchaseOrder.status}".`
      );
    }

    // ==================================================
    // 12. EXPIRATION CHECK
    // ==================================================

    if (
      purchaseOrder.expiresAt &&
      new Date(
        purchaseOrder.expiresAt
      ).getTime() <= Date.now()
    ) {
      purchaseOrder.status =
        "expired";

      await purchaseOrder.save({
        session,
      });

      throw new Error(
        "This purchase request has expired."
      );
    }

    // ==================================================
    // 13. COMPLETE PURCHASE
    // ==================================================

    const result =
      await completePurchaseOrder({
        purchaseOrderId:
          purchaseOrder._id.toString(),

        session,

        paymentMethod: "cash",

        gatewayOrderId: null,

        gatewayPaymentId: null,

        transactionId:
          `CASH-${purchaseOrder._id.toString()}`,

        /*
         * Admin who entered/recorded the payment.
         */
        recordedBy: adminId,

        /*
         * Admin who physically received the cash.
         *
         * For the current workflow the confirming
         * admin is considered the receiver.
         */
        receivedBy: adminId,
      });

    // ==================================================
    // 14. COMMIT TRANSACTION
    // ==================================================

    await session.commitTransaction();

    // ==================================================
    // 15. SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Cash payment confirmed successfully. Account and membership have been activated.",

        purchaseOrder: {
          id:
            result.purchaseOrder._id.toString(),

          orderNumber:
            result.purchaseOrder.orderNumber,

          status:
            result.purchaseOrder.status,
        },

        user: {
          id:
            result.user._id.toString(),

          name:
            result.user.name,

          email:
            result.user.email,

          phone:
            result.user.phone,
        },

        membership: {
          id:
            result.membership._id.toString(),

          startDate:
            result.membership.startDate,

          endDate:
            result.membership.endDate,
        },

        payment: {
          id:
            result.payment._id.toString(),

          amount:
            result.payment.amount,

          method:
            result.payment.method,

          status:
            result.payment.status,

          transactionId:
            result.payment.transactionId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // ==================================================
    // 16. ROLLBACK
    // ==================================================

    if (session) {
      try {
        if (
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }
      } catch (abortError) {
        console.error(
          "ADMIN CASH PURCHASE ABORT ERROR:",
          abortError
        );
      }
    }

    console.error(
      "ADMIN CASH PURCHASE CONFIRM ERROR:",
      error
    );

    const message =
      error?.message || "";

    // ==================================================
    // 17. SAFE BUSINESS ERROR DETECTION
    // ==================================================

    const businessErrorPatterns = [
      "Purchase order not found",
      "Only cash purchase requests",
      "Purchase order cannot be confirmed",
      "This purchase request has expired",
      "An account already exists",
      "Primary member and partner",
      "Partner phone number",
      "Partner email",
      "Complete partner information",
      "Purchase amount",
      "Membership plan",
      "Purchase order password",
      "Registration fee",
      "Add-on",
      "Couple members",
      "membership plan cannot",
      "invalid contact details",
    ];

    const isBusinessError =
      businessErrorPatterns.some(
        (pattern) =>
          message.includes(pattern)
      );

    // ==================================================
    // 18. RESPONSE
    // ==================================================

    if (isBusinessError) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to confirm cash payment. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    // ==================================================
    // 19. CLOSE SESSION
    // ==================================================

    if (session) {
      await session.endSession();
    }
  }
}