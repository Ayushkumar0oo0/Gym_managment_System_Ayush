import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import { connectDB } from "@/lib/mongodb";
import PurchaseOrder from "@/models/PurchaseOrder";
import Payment from "@/models/Payment";
import { completePurchaseOrder } from "@/lib/completePurchaseOrder";

import {
  paymentRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(request) {
  let session = null;

  try {
    // ==================================================
    // 1. RATE LIMIT
    // ==================================================

    const clientIp = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        createRateLimitIdentifier(
          "public-purchase-razorpay-verify",
          clientIp
        )
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(
        rateLimitResult
      );
    }

    // ==================================================
    // 2. READ REQUEST BODY
    // ==================================================

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

    const {
      purchaseOrderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body || {};

    if (
      !purchaseOrderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment verification details are incomplete.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 3. VALIDATE PURCHASE ORDER ID
    // ==================================================

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
    // 4. RAZORPAY CONFIGURATION
    // ==================================================

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      console.error(
        "PUBLIC PURCHASE VERIFY: Razorpay configuration missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    // ==================================================
    // 5. DATABASE
    // ==================================================

    await connectDB();

    // ==================================================
    // 6. LOAD PURCHASE ORDER
    // ==================================================

    const purchaseOrder =
      await PurchaseOrder.findById(
        purchaseOrderId
      ).select(
        "_id orderNumber totalAmount paymentMethod status gatewayOrderId gatewayPaymentId expiresAt user membership payment"
      );

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase order not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 7. ALREADY COMPLETED
    // ==================================================

    if (
      purchaseOrder.status ===
        "completed" &&
      purchaseOrder.user &&
      purchaseOrder.membership &&
      purchaseOrder.payment
    ) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Payment was already completed.",
          purchaseOrder: {
            id: purchaseOrder._id.toString(),
            orderNumber:
              purchaseOrder.orderNumber,
            status:
              purchaseOrder.status,
          },
        },
        { status: 200 }
      );
    }

   
 // 8. PAYMENT METHOD MUST BE ONLINE

if (
  !["online", "upi"].includes(purchaseOrder.paymentMethod)
) {
  return NextResponse.json(
    {
      success: false,
      message:
        "This purchase order is not an online payment order.",
    },
    { status: 400 }
  );
}


    // ==================================================
    // 9. PURCHASE ORDER MUST BE PENDING
    // ==================================================

    if (
      purchaseOrder.status !==
      "payment_pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This purchase order is no longer available for payment verification.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 10. EXPIRATION CHECK
    // ==================================================

    if (
      purchaseOrder.expiresAt &&
      new Date(
        purchaseOrder.expiresAt
      ).getTime() <= Date.now()
    ) {
      await PurchaseOrder.findOneAndUpdate(
        {
          _id: purchaseOrder._id,
          status: "payment_pending",
        },
        {
          $set: {
            status: "expired",
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "This purchase order has expired. Please start again.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 11. RAZORPAY ORDER MUST MATCH
    // ==================================================

    if (
      !purchaseOrder.gatewayOrderId ||
      purchaseOrder.gatewayOrderId !==
        razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment order could not be verified.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 12. VERIFY RAZORPAY SIGNATURE
    // ==================================================

    const signaturePayload =
      `${razorpayOrderId}|${razorpayPaymentId}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpayKeySecret
        )
        .update(signaturePayload)
        .digest("hex");

    const receivedSignatureBuffer =
      Buffer.from(
        String(razorpaySignature),
        "utf8"
      );

    const expectedSignatureBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    if (
      receivedSignatureBuffer.length !==
      expectedSignatureBuffer.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    const signatureValid =
      crypto.timingSafeEqual(
        receivedSignatureBuffer,
        expectedSignatureBuffer
      );

    if (!signatureValid) {
      console.warn(
        "PUBLIC PURCHASE VERIFY: Invalid Razorpay signature.",
        {
          purchaseOrderId,
          razorpayOrderId,
          razorpayPaymentId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 13. RAZORPAY CLIENT
    // ==================================================

    const razorpay =
      new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

    // ==================================================
    // 14. FETCH PAYMENT FROM RAZORPAY
    // ==================================================

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpayPaymentId
      );

    if (razorpayPayment.status !== "captured") {
  return NextResponse.json(
    {
      success: false,
      message: "Payment has not been captured.",
    },
    { status: 400 }
  );
}


    // ==================================================
    // 15. VERIFY ORDER ID
    // ==================================================

    if (
      razorpayPayment.order_id !==
      razorpayOrderId
    ) {
      console.error(
        "PUBLIC PURCHASE VERIFY: Razorpay order mismatch.",
        {
          purchaseOrderId,
          expected:
            razorpayOrderId,
          received:
            razorpayPayment.order_id,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment order mismatch.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 16. VERIFY PAYMENT AMOUNT
    // ==================================================

    const expectedAmount =
      Math.round(
        Number(
          purchaseOrder.totalAmount
        ) * 100
      );

    const receivedAmount =
      Number(
        razorpayPayment.amount
      );

    if (
      !Number.isInteger(
        expectedAmount
      ) ||
      expectedAmount <= 0 ||
      receivedAmount !==
        expectedAmount
    ) {
      console.error(
        "PUBLIC PURCHASE VERIFY: Payment amount mismatch.",
        {
          purchaseOrderId,
          expectedAmount,
          receivedAmount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment amount mismatch.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 17. VERIFY CURRENCY
    // ==================================================

    if (
      razorpayPayment.currency !==
      "INR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payment currency.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 19. START TRANSACTION
    // ==================================================

    session =
      await mongoose.startSession();

    session.startTransaction();

    // ==================================================
    // 20. RELOAD PURCHASE ORDER INSIDE TRANSACTION
    // ==================================================

    const lockedPurchaseOrder =
      await PurchaseOrder.findById(
        purchaseOrder._id
      )
        .select("+passwordHash")
        .session(session);

    if (!lockedPurchaseOrder) {
      throw new Error(
        "Purchase order no longer exists."
      );
    }

    // ==================================================
    // 21. HANDLE CONCURRENT COMPLETION
    // ==================================================

    if (
      lockedPurchaseOrder.status ===
        "completed" &&
      lockedPurchaseOrder.user &&
      lockedPurchaseOrder.membership &&
      lockedPurchaseOrder.payment
    ) {
      await session.commitTransaction();

      return NextResponse.json(
        {
          success: true,
          message:
            "Payment was already completed.",
          purchaseOrder: {
            id: lockedPurchaseOrder._id.toString(),
            orderNumber:
              lockedPurchaseOrder.orderNumber,
            status:
              lockedPurchaseOrder.status,
          },
        },
        { status: 200 }
      );
    }

    // ==================================================
    // 22. VERIFY STATUS AGAIN
    // ==================================================

    if (
      lockedPurchaseOrder.status !==
      "payment_pending"
    ) {
      throw new Error(
        "Purchase order is no longer waiting for payment."
      );
    }

    // ==================================================
    // 23. VERIFY EXPIRATION AGAIN
    // ==================================================

    if (
  lockedPurchaseOrder.expiresAt &&
  new Date(lockedPurchaseOrder.expiresAt).getTime() <= Date.now()
) {
  throw new Error("Purchase order has expired.");
}

    // ==================================================
    // 24. VERIFY ORDER ID AGAIN
    // ==================================================

    if (
      lockedPurchaseOrder.gatewayOrderId !==
      razorpayOrderId
    ) {
      throw new Error(
        "Razorpay order ID no longer matches the purchase order."
      );
    }

    // ==================================================
    // 25. VERIFY EXISTING GATEWAY PAYMENT ID
    // ==================================================

    if (
      lockedPurchaseOrder.gatewayPaymentId &&
      lockedPurchaseOrder.gatewayPaymentId !==
        razorpayPaymentId
    ) {
      throw new Error(
        "A different Razorpay payment is already associated with this purchase."
      );
    }

    // ==================================================
    // 26. CHECK DUPLICATE RAZORPAY PAYMENT
    // ==================================================

    const existingPayment =
      await Payment.findOne({
        gatewayPaymentId:
          razorpayPaymentId,
      }).session(session);

    if (existingPayment) {
      /*
       * If the payment already belongs to
       * this purchase and the purchase was
       * not marked completed due to a retry,
       * don't create another Payment.
       */
      if (
        String(
          existingPayment.gatewayOrderId
        ) ===
          String(razorpayOrderId) &&
        String(
          existingPayment.user
        ) ===
          String(
            lockedPurchaseOrder.user ||
              ""
          )
      ) {
        throw new Error(
          "This Razorpay payment has already been recorded."
        );
      }

      throw new Error(
        "This Razorpay payment has already been used."
      );
    }

    // ==================================================
    // 27. COMPLETE PURCHASE
    // ==================================================

    const result =
      await completePurchaseOrder({
        purchaseOrderId:
          lockedPurchaseOrder._id.toString(),

        session,

        paymentMethod: "online",

        gatewayOrderId:
          razorpayOrderId,

        gatewayPaymentId:
          razorpayPaymentId,

        transactionId:
          razorpayPaymentId,

        recordedBy: null,

        receivedBy: null,
      });

    // ==================================================
    // 28. COMMIT
    // ==================================================

    await session.commitTransaction();

    // ==================================================
    // 29. SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment verified successfully.",

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
        },

        membership: {
          id:
            result.membership._id.toString(),

          startDate:
            result.membership.startDate,

          endDate:
            result.membership.endDate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // ==================================================
    // 30. ROLLBACK
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
          "PUBLIC PURCHASE VERIFY ABORT ERROR:",
          abortError
        );
      }
    }

    console.error(
      "PUBLIC PURCHASE RAZORPAY VERIFY ERROR:",
      error
    );

    const message =
      error?.message || "";

    // ==================================================
    // KNOWN BUSINESS ERRORS
    // ==================================================

    const knownErrors = [
      "Purchase order has expired.",
      "Purchase order is no longer waiting for payment.",
      "Razorpay order ID no longer matches the purchase order.",
      "A different Razorpay payment is already associated with this purchase.",
      "This Razorpay payment has already been recorded.",
      "This Razorpay payment has already been used.",
      "Payment method does not match the purchase order.",
      "Purchase order not found.",
      "Membership plan no longer exists.",
      "Purchase amount mismatch.",
      "Purchase amount cannot be negative.",
      "Invalid purchase amount.",
      "Purchase order password is missing.",
      "Membership plan is not available for the selected gender.",
      "This membership plan cannot be used for a couple membership.",
    ];

    if (
      knownErrors.some(
        (knownError) =>
          message === knownError
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 }
      );
    }

    // ==================================================
    // GENERIC ERROR
    // ==================================================

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify payment. Please contact the gym if money was deducted.",
      },
      { status: 500 }
    );
  } finally {
    // ==================================================
    // 31. END SESSION
    // ==================================================

    if (session) {
      await session.endSession();
    }
  }
}