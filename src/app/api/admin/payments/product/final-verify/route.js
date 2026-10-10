
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

function errorResponse(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function validMoney(value) {
  const amount = Number(value);

  return (
    Number.isFinite(amount) &&
    amount >= 0 &&
    Number.isSafeInteger(Math.round(amount * 100))
  );
}

function verifySignature(orderId, paymentId, signature, secret) {
  if (
    typeof signature !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(signature)
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();

  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request) {
  let dbSession = null;

  try {
    // 1. Authenticate.
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse("Unauthorized.", 401);
    }

    // 2. Rate limit.
    const clientIp = getClientIp(request);

    const rateLimitResult = await paymentRateLimit.limit(
      createRateLimitIdentifier(
        "final-product-payment-verify",
        `${session.user.id}:${clientIp}`
      )
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // 3. Validate the request.
    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request.", 400);
    }

    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body ?? {};

    if (
      typeof paymentId !== "string" ||
      !mongoose.isValidObjectId(paymentId) ||
      typeof razorpayOrderId !== "string" ||
      !razorpayOrderId ||
      typeof razorpayPaymentId !== "string" ||
      !razorpayPaymentId ||
      typeof razorpaySignature !== "string" ||
      !razorpaySignature
    ) {
      return errorResponse(
        "Payment verification details are invalid.",
        400
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured.");
      return errorResponse(
        "Payment verification is temporarily unavailable.",
        503
      );
    }

    // 4. Connect to MongoDB.
    await connectDB();

    // 5. Find the payment.
    const existingPayment = await Payment.findById(paymentId);

    if (!existingPayment) {
      return errorResponse("Payment record not found.", 404);
    }

    if (
      !existingPayment.user ||
      existingPayment.user.toString() !== session.user.id
    ) {
      return errorResponse(
        "You are not allowed to verify this payment.",
        403
      );
    }

    if (existingPayment.paymentType !== "product") {
      return errorResponse("Invalid payment type.", 400);
    }

    if (existingPayment.method !== "upi") {
      return errorResponse(
        "This payment is not a UPI payment.",
        400
      );
    }

    if (existingPayment.gatewayOrderId !== razorpayOrderId) {
      return errorResponse(
        "Razorpay order ID does not match.",
        400
      );
    }

    // 6. Idempotency: a retry must use the same payment ID.
    if (existingPayment.status === "paid") {
      if (
        existingPayment.gatewayPaymentId !== razorpayPaymentId
      ) {
        return errorResponse(
          "Payment was already completed with a different payment ID.",
          409
        );
      }

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment already verified.",
        payment: {
          id: existingPayment._id.toString(),
          status: existingPayment.status,
          amount: existingPayment.amount,
          gatewayPaymentId: existingPayment.gatewayPaymentId,
          paidAt: existingPayment.paidAt,
        },
      });
    }

    if (existingPayment.status !== "pending") {
      return errorResponse(
        `Payment cannot be verified because its status is ${existingPayment.status}.`,
        409
      );
    }

    // 7. Verify the signature.
    if (
      !verifySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        secret
      )
    ) {
      return errorResponse(
        "Invalid Razorpay payment signature.",
        400
      );
    }

    // 8. Fetch authoritative payment details from Razorpay.
    const razorpay = getRazorpayClient();

    const razorpayPayment =
      await razorpay.payments.fetch(razorpayPaymentId);

    if (
      !razorpayPayment ||
      razorpayPayment.id !== razorpayPaymentId ||
      razorpayPayment.order_id !== razorpayOrderId
    ) {
      return errorResponse(
        "Razorpay payment details do not match.",
        400
      );
    }

    if (razorpayPayment.status !== "captured") {
      return errorResponse(
        "Razorpay payment has not been captured.",
        400
      );
    }

    // B: Require INR. Missing currency is rejected too.
    if (razorpayPayment.currency !== "INR") {
      return errorResponse(
        "Razorpay payment currency must be INR.",
        400
      );
    }

    // 9. Validate the product order and outstanding balance.
    const order = await ProductOrder.findById(
      existingPayment.productOrder
    );

    if (!order) {
      return errorResponse("Product order not found.", 404);
    }

    if (
      !order.user ||
      order.user.toString() !== session.user.id
    ) {
      return errorResponse(
        "You are not allowed to update this order.",
        403
      );
    }

    const totalAmount = Number(order.totalAmount);
    const initialPaidAmount = Number(
      order.initialPaidAmount || 0
    );
    const finalPaidAmount = Number(
      order.finalPaidAmount || 0
    );
    const paymentAmount = Number(existingPayment.amount);

    if (
      !validMoney(totalAmount) ||
      totalAmount <= 0 ||
      !validMoney(initialPaidAmount) ||
      !validMoney(finalPaidAmount) ||
      !validMoney(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return errorResponse(
        "Product order payment amounts are invalid.",
        400
      );
    }

    const remainingAmount = Number(
      (
        totalAmount -
        initialPaidAmount -
        finalPaidAmount
      ).toFixed(2)
    );

    if (remainingAmount <= 0) {
      return errorResponse(
        "There is no remaining amount for this order.",
        409
      );
    }

    if (paymentAmount !== remainingAmount) {
      return errorResponse(
        "Payment amount does not match the remaining order amount.",
        400
      );
    }

    if (
      Number(razorpayPayment.amount) !==
      Math.round(paymentAmount * 100)
    ) {
      return errorResponse(
        "Razorpay payment amount does not match the expected amount.",
        400
      );
    }

    // 10. Update both records atomically.
    dbSession = await mongoose.startSession();

    let transactionResult = null;

    await dbSession.withTransaction(async () => {
      // Reset on every transaction retry.
      transactionResult = null;

      const payment = await Payment.findById(paymentId)
        .session(dbSession);

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      if (
        !payment.user ||
        payment.user.toString() !== session.user.id ||
        payment.paymentType !== "product" ||
        payment.method !== "upi" ||
        payment.gatewayOrderId !== razorpayOrderId
      ) {
        throw new Error("PAYMENT_MISMATCH");
      }

      // C: Check the submitted Razorpay payment ID again
      // inside the transaction before returning idempotent success.
      if (payment.status === "paid") {
        if (payment.gatewayPaymentId !== razorpayPaymentId) {
          throw new Error("PAYMENT_ID_CONFLICT");
        }

        transactionResult = {
          alreadyProcessed: true,
          payment,
        };

        return;
      }

      if (payment.status !== "pending") {
        throw new Error("PAYMENT_NOT_PENDING");
      }

      const currentOrder = await ProductOrder.findById(
        payment.productOrder
      ).session(dbSession);

      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (
        !currentOrder.user ||
        currentOrder.user.toString() !== session.user.id
      ) {
        throw new Error("ORDER_OWNERSHIP");
      }

      const currentTotal = Number(currentOrder.totalAmount);
      const currentInitialPaid = Number(
        currentOrder.initialPaidAmount || 0
      );
      const currentFinalPaid = Number(
        currentOrder.finalPaidAmount || 0
      );
      const currentPaymentAmount = Number(payment.amount);

      if (
        !validMoney(currentTotal) ||
        !validMoney(currentInitialPaid) ||
        !validMoney(currentFinalPaid) ||
        !validMoney(currentPaymentAmount) ||
        currentPaymentAmount <= 0
      ) {
        throw new Error("AMOUNT_INVALID");
      }

      const currentRemaining = Number(
        (
          currentTotal -
          currentInitialPaid -
          currentFinalPaid
        ).toFixed(2)
      );

      if (currentRemaining <= 0) {
        throw new Error("NO_BALANCE");
      }

      if (currentPaymentAmount !== currentRemaining) {
        throw new Error("AMOUNT_MISMATCH");
      }

      if (
        Number(razorpayPayment.amount) !==
        Math.round(currentPaymentAmount * 100)
      ) {
        throw new Error("AMOUNT_MISMATCH");
      }

      const now = new Date();

      payment.status = "paid";
      payment.gatewayPaymentId = razorpayPaymentId;
      payment.paidAt = now;
      payment.transactionId =
        payment.transactionId || razorpayPaymentId;

      currentOrder.finalPaymentMethod = "upi";
      currentOrder.finalPaidAmount =
        currentFinalPaid + currentPaymentAmount;
      currentOrder.finalPaymentStatus = "paid";
      currentOrder.remainingAmount = 0;
      currentOrder.paymentStatus = "paid";
      currentOrder.finalPaidAt = now;

      await payment.save({ session: dbSession });
      await currentOrder.save({ session: dbSession });

      transactionResult = {
        alreadyProcessed: false,
        payment,
        order: currentOrder,
        amount: currentPaymentAmount,
      };
    });

    await dbSession.endSession();
    dbSession = null;

    if (transactionResult?.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment already verified.",
        payment: {
          id: transactionResult.payment._id.toString(),
          status: transactionResult.payment.status,
          gatewayPaymentId:
            transactionResult.payment.gatewayPaymentId,
          paidAt: transactionResult.payment.paidAt,
        },
      });
    }

    // 11. Notify after the transaction commits.
    try {
      await createNotification({
        user: transactionResult.order.user,
        type: "payment",
        title: "Payment Successful",
        message: `Your final payment of ₹${transactionResult.amount.toLocaleString("en-IN")} for your product order has been received successfully.`,
        productOrder: transactionResult.order._id,
        link: `/orders/${transactionResult.order._id}`,
      });
    } catch (notificationError) {
      console.error(
        "FINAL PRODUCT PAYMENT NOTIFICATION ERROR:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      payment: {
        id: transactionResult.payment._id.toString(),
        status: transactionResult.payment.status,
        amount: transactionResult.payment.amount,
        method: transactionResult.payment.method,
        paymentType: transactionResult.payment.paymentType,
        gatewayOrderId: transactionResult.payment.gatewayOrderId,
        gatewayPaymentId:
          transactionResult.payment.gatewayPaymentId,
        transactionId: transactionResult.payment.transactionId,
        paidAt: transactionResult.payment.paidAt,
      },
      order: {
        id: transactionResult.order._id.toString(),
        paymentStatus: transactionResult.order.paymentStatus,
        finalPaymentStatus:
          transactionResult.order.finalPaymentStatus,
        finalPaidAmount: transactionResult.order.finalPaidAmount,
        remainingAmount: transactionResult.order.remainingAmount,
      },
    });
  } catch (error) {
    console.error("FINAL PRODUCT PAYMENT VERIFY ERROR:", error);

    const errors = {
      PAYMENT_NOT_FOUND: ["Payment record not found.", 404],
      PAYMENT_MISMATCH: ["Payment details do not match.", 400],
      PAYMENT_ID_CONFLICT: [
        "Payment was already completed with a different payment ID.",
        409,
      ],
      PAYMENT_NOT_PENDING: ["Payment is no longer pending.", 409],
      ORDER_NOT_FOUND: ["Product order not found.", 404],
      ORDER_OWNERSHIP: ["You are not allowed to update this order.", 403],
      AMOUNT_INVALID: ["Product order payment amounts are invalid.", 400],
      NO_BALANCE: ["There is no remaining amount for this order.", 409],
      AMOUNT_MISMATCH: [
        "Payment amount does not match the remaining order amount.",
        400,
      ],
    };

    const known = errors[error?.message];

    if (known) {
      return errorResponse(known[0], known[1]);
    }

    return errorResponse(
      "Payment verification failed. Please try again or contact the gym administrator.",
      500
    );
  } finally {
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
  }
}