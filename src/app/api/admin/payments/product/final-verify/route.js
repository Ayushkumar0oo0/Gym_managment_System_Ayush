import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Payment from "@/models/Payment";
import ProductOrder from "@/models/ProductOrder";

import { createNotification } from "@/lib/notifications";

import {
  paymentRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function normalizeRazorpayAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}

export async function POST(request) {
  let dbSession = null;

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

    // =========================================================
    // 2. RATE LIMIT
    // =========================================================

    const clientIp = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        createRateLimitIdentifier(
          "final-product-payment-verify",
          `${session.user.id}:${clientIp}`
        )
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // =========================================================
    // 3. READ REQUEST BODY
    // =========================================================

    const body = await request.json();

    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (
      !paymentId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment verification details are required.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 4. VALIDATE PAYMENT ID
    // =========================================================

    if (
      !mongoose.Types.ObjectId.isValid(paymentId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 5. CONNECT DATABASE
    // =========================================================

    await connectDB();

    // =========================================================
    // 6. FIND PAYMENT
    // =========================================================

    const existingPayment =
      await Payment.findById(paymentId);

    if (!existingPayment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 7. PAYMENT OWNERSHIP
    // =========================================================

    if (
      !existingPayment.user ||
      existingPayment.user.toString() !==
        session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not allowed to verify this payment.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 8. PAYMENT TYPE
    // =========================================================

    if (
      existingPayment.paymentType !==
      "product"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment type.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 9. PAYMENT METHOD
    // =========================================================

    if (existingPayment.method !== "upi") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This payment is not a UPI payment.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 10. RAZORPAY ORDER ID
    // =========================================================

    if (
      existingPayment.gatewayOrderId !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay order ID does not match.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 11. IDEMPOTENCY
    //
    // If this payment was already processed, don't process
    // the order again.
    // =========================================================

    if (existingPayment.status === "paid") {
      return NextResponse.json(
        {
          success: true,
          alreadyProcessed: true,
          message: "Payment already verified.",
          payment: {
            id: existingPayment._id,
            status: existingPayment.status,
            amount: existingPayment.amount,
            gatewayPaymentId:
              existingPayment.gatewayPaymentId,
            paidAt: existingPayment.paidAt,
          },
        },
        { status: 200 }
      );
    }

    // =========================================================
    // 12. PAYMENT MUST BE PENDING
    // =========================================================

    if (existingPayment.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message:
            `Payment is already ${existingPayment.status}.`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 13. VERIFY RAZORPAY CONFIGURATION
    // =========================================================

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "RAZORPAY_KEY_SECRET is not configured."
      );
    }

    // =========================================================
    // 14. VERIFY RAZORPAY SIGNATURE
    // =========================================================

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    const providedSignatureBuffer =
      Buffer.from(
        String(razorpaySignature),
        "utf8"
      );

    const generatedSignatureBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    if (
      providedSignatureBuffer.length !==
      generatedSignatureBuffer.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay payment signature.",
        },
        { status: 400 }
      );
    }

    const signatureValid =
      crypto.timingSafeEqual(
        providedSignatureBuffer,
        generatedSignatureBuffer
      );

    if (!signatureValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay payment signature.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 15. FETCH PAYMENT DIRECTLY FROM RAZORPAY
    // =========================================================

    const razorpay = getRazorpayClient();

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpayPaymentId
      );

    if (!razorpayPayment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment could not be found.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 16. VERIFY RAZORPAY PAYMENT ID
    // =========================================================

    if (
      razorpayPayment.id !==
      razorpayPaymentId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment ID does not match.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 17. VERIFY RAZORPAY ORDER ID
    // =========================================================

    if (
      razorpayPayment.order_id !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment is linked to a different order.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 18. VERIFY PAYMENT STATUS
    // =========================================================

    if (
      razorpayPayment.status !== "captured"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Razorpay payment is not captured. Current status: ${razorpayPayment.status}.`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 19. VERIFY CURRENCY
    // =========================================================

    if (
      razorpayPayment.currency &&
      razorpayPayment.currency !== "INR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment currency is invalid.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 20. VERIFY ORDER
    // =========================================================

    const order =
      await ProductOrder.findById(
        existingPayment.productOrder
      );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Product order not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 21. ORDER OWNERSHIP
    // =========================================================

    if (
      !order.user ||
      order.user.toString() !==
        session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not allowed to update this order.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 22. CALCULATE REMAINING AMOUNT
    // =========================================================

    const totalAmount =
      Number(order.totalAmount || 0);

    const initialPaidAmount =
      Number(order.initialPaidAmount || 0);

    const finalPaidAmount =
      Number(order.finalPaidAmount || 0);

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount < 0 ||
      !Number.isFinite(initialPaidAmount) ||
      initialPaidAmount < 0 ||
      !Number.isFinite(finalPaidAmount) ||
      finalPaidAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product order payment amounts are invalid.",
        },
        { status: 400 }
      );
    }

    const remainingAmount = Math.max(
      totalAmount -
        initialPaidAmount -
        finalPaidAmount,
      0
    );

    // =========================================================
    // 23. ORDER ALREADY PAID
    // =========================================================

    if (remainingAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "There is no remaining amount for this order.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 24. VERIFY DATABASE PAYMENT AMOUNT
    // =========================================================

    const paymentAmount =
      normalizeRazorpayAmount(
        existingPayment.amount
      );

    if (
      paymentAmount === null ||
      paymentAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Stored payment amount is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      paymentAmount !== remainingAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment amount does not match the remaining order amount.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 25. VERIFY RAZORPAY AMOUNT
    //
    // Razorpay stores amount in paise.
    // Example:
    // ₹500 -> 50000 paise
    // =========================================================

    const razorpayAmount =
      Number(razorpayPayment.amount);

    if (
      !Number.isFinite(razorpayAmount) ||
      razorpayAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment amount is invalid.",
        },
        { status: 400 }
      );
    }

    const expectedRazorpayAmount =
      Math.round(paymentAmount * 100);

    if (
      razorpayAmount !==
      expectedRazorpayAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment amount does not match the expected amount.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 26. START TRANSACTION
    // =========================================================

    dbSession = await mongoose.startSession();

    let transactionResult = null;

    await dbSession.withTransaction(
      async () => {
        // =====================================================
        // RE-FETCH PAYMENT INSIDE TRANSACTION
        // =====================================================

        const payment =
          await Payment.findById(
            paymentId
          ).session(dbSession);

        if (!payment) {
          throw new Error(
            "Payment record not found."
          );
        }

        // =====================================================
        // CONCURRENT REQUEST / IDEMPOTENCY CHECK
        // =====================================================

        if (payment.status === "paid") {
          transactionResult = {
            alreadyProcessed: true,
            payment,
          };

          return;
        }

        if (payment.status !== "pending") {
          throw new Error(
            `Payment is already ${payment.status}.`
          );
        }

        // =====================================================
        // RECHECK PAYMENT OWNERSHIP
        // =====================================================

        if (
          !payment.user ||
          payment.user.toString() !==
            session.user.id
        ) {
          throw new Error(
            "You are not allowed to verify this payment."
          );
        }

        // =====================================================
        // RECHECK PAYMENT TYPE
        // =====================================================

        if (
          payment.paymentType !== "product"
        ) {
          throw new Error(
            "Invalid payment type."
          );
        }

        // =====================================================
        // RECHECK PAYMENT METHOD
        // =====================================================

        if (payment.method !== "upi") {
          throw new Error(
            "This payment is not a UPI payment."
          );
        }

        // =====================================================
        // RECHECK RAZORPAY ORDER
        // =====================================================

        if (
          payment.gatewayOrderId !==
          razorpayOrderId
        ) {
          throw new Error(
            "Razorpay order ID does not match."
          );
        }

        // =====================================================
        // RE-FETCH PRODUCT ORDER
        // =====================================================

        const currentOrder =
          await ProductOrder.findById(
            payment.productOrder
          ).session(dbSession);

        if (!currentOrder) {
          throw new Error(
            "Product order not found."
          );
        }

        // =====================================================
        // RECHECK ORDER OWNERSHIP
        // =====================================================

        if (
          !currentOrder.user ||
          currentOrder.user.toString() !==
            session.user.id
        ) {
          throw new Error(
            "You are not allowed to update this order."
          );
        }

        // =====================================================
        // RECHECK ORDER AMOUNTS
        // =====================================================

        const currentTotalAmount =
          Number(
            currentOrder.totalAmount || 0
          );

        const currentInitialPaidAmount =
          Number(
            currentOrder.initialPaidAmount || 0
          );

        const currentFinalPaidAmount =
          Number(
            currentOrder.finalPaidAmount || 0
          );

        const currentRemainingAmount =
          Math.max(
            currentTotalAmount -
              currentInitialPaidAmount -
              currentFinalPaidAmount,
            0
          );

        if (
          currentRemainingAmount <= 0
        ) {
          throw new Error(
            "There is no remaining amount for this order."
          );
        }

        // =====================================================
        // VERIFY PAYMENT AMOUNT AGAIN
        // =====================================================

        const currentPaymentAmount =
          Number(payment.amount);

        if (
          !Number.isFinite(
            currentPaymentAmount
          ) ||
          currentPaymentAmount !==
            currentRemainingAmount
        ) {
          throw new Error(
            "Payment amount does not match the remaining order amount."
          );
        }

        // =====================================================
        // VERIFY RAZORPAY AMOUNT AGAIN
        // =====================================================

        if (
          razorpayAmount !==
          Math.round(
            currentPaymentAmount * 100
          )
        ) {
          throw new Error(
            "Razorpay payment amount does not match the expected amount."
          );
        }

        // =====================================================
        // MARK PAYMENT PAID
        // =====================================================

        payment.status = "paid";

        payment.gatewayPaymentId =
          razorpayPaymentId;

        payment.paidAt = new Date();

        payment.transactionId =
          payment.transactionId ||
          razorpayPaymentId;

        // =====================================================
        // UPDATE PRODUCT ORDER
        // =====================================================

        currentOrder.finalPaymentMethod =
          "upi";

        currentOrder.finalPaidAmount =
          Number(
            currentOrder.finalPaidAmount || 0
          ) + currentPaymentAmount;

        currentOrder.finalPaymentStatus =
          "paid";

        currentOrder.remainingAmount = 0;

        currentOrder.paymentStatus =
          "paid";

        currentOrder.finalPaidAt =
          new Date();

        // =====================================================
        // SAVE BOTH INSIDE SAME TRANSACTION
        // =====================================================

        await payment.save({
          session: dbSession,
        });

        await currentOrder.save({
          session: dbSession,
        });

        transactionResult = {
          alreadyProcessed: false,
          payment,
          order: currentOrder,
          amount: currentPaymentAmount,
        };
      }
    );

    // =========================================================
    // CLOSE DATABASE SESSION
    // =========================================================

    await dbSession.endSession();
    dbSession = null;

    // =========================================================
    // ALREADY PROCESSED
    // =========================================================

    if (
      transactionResult?.alreadyProcessed
    ) {
      return NextResponse.json(
        {
          success: true,
          alreadyProcessed: true,
          message:
            "Payment was already verified.",
          payment: {
            id:
              transactionResult.payment
                ._id,
            status:
              transactionResult.payment
                .status,
            amount:
              transactionResult.payment
                .amount,
            gatewayPaymentId:
              transactionResult.payment
                .gatewayPaymentId,
            paidAt:
              transactionResult.payment
                .paidAt,
          },
        },
        { status: 200 }
      );
    }

    // =========================================================
    // 27. CREATE NOTIFICATION
    //
    // Notification failure must NOT undo the successful
    // payment transaction.
    // =========================================================

    try {
      await createNotification({
        user:
          transactionResult.order.user,

        type: "payment",

        title: "Payment Successful",

        message: `Your final payment of ₹${Number(
          transactionResult.amount
        ).toLocaleString(
          "en-IN"
        )} for your product order has been received successfully.`,

        productOrder:
          transactionResult.order._id,

        link: `/orders/${transactionResult.order._id}`,
      });
    } catch (notificationError) {
      console.error(
        "CREATE FINAL PAYMENT NOTIFICATION ERROR:",
        notificationError
      );
    }

    // =========================================================
    // 28. SUCCESS
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment verified successfully.",

        payment: {
          id:
            transactionResult.payment
              ._id,

          status:
            transactionResult.payment
              .status,

          amount:
            transactionResult.payment
              .amount,

          method:
            transactionResult.payment
              .method,

          paymentType:
            transactionResult.payment
              .paymentType,

          gatewayOrderId:
            transactionResult.payment
              .gatewayOrderId,

          gatewayPaymentId:
            transactionResult.payment
              .gatewayPaymentId,

          transactionId:
            transactionResult.payment
              .transactionId,

          paidAt:
            transactionResult.payment
              .paidAt,
        },

        order: {
          id:
            transactionResult.order
              ._id,

          paymentStatus:
            transactionResult.order
              .paymentStatus,

          finalPaymentStatus:
            transactionResult.order
              .finalPaymentStatus,

          finalPaidAmount:
            transactionResult.order
              .finalPaidAmount,

          remainingAmount:
            transactionResult.order
              .remainingAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FINAL PRODUCT PAYMENT VERIFY ERROR:",
      error
    );

    // =========================================================
    // CLOSE SESSION ON ERROR
    // =========================================================

    if (dbSession) {
      try {
        await dbSession.endSession();
      } catch (sessionError) {
        console.error(
          "FAILED TO CLOSE PAYMENT DB SESSION:",
          sessionError
        );
      }
    }

    // =========================================================
    // KNOWN ERRORS
    // =========================================================

    const knownErrors = [
      "Payment record not found.",
      "Invalid payment type.",
      "This payment is not a UPI payment.",
      "Razorpay order ID does not match.",
      "You are not allowed to verify this payment.",
      "Product order not found.",
      "You are not allowed to update this order.",
      "There is no remaining amount for this order.",
      "Payment amount does not match the remaining order amount.",
      "Razorpay payment amount does not match the expected amount.",
    ];

    if (
      knownErrors.includes(
        error?.message
      ) ||
      error?.message?.startsWith(
        "Payment is already "
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}