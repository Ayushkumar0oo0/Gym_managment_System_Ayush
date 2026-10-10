
import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import razorpay from "@/lib/razorpay";
import { createNotification } from "@/lib/notifications";

import Payment from "@/models/Payment";
import ProductOrder from "@/models/ProductOrder";

function response(message, status = 400) {
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

function safeCompareHex(expected, received) {
  if (
    typeof received !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(received)
  ) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request) {
  let dbSession = null;

  try {
    // 1. Authenticate.
    const session = await auth();

    if (!session?.user?.id) {
      return response("Unauthorized.", 401);
    }

    // 2. Validate request data.
    let body;

    try {
      body = await request.json();
    } catch {
      return response("Invalid JSON request.", 400);
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
      return response("Payment verification details are invalid.", 400);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is not configured.");
      return response("Payment verification is unavailable.", 503);
    }

    // 3. Connect to the database.
    await connectDB();

    // 4. Find the member's final product payment.
    const payment = await Payment.findOne({
      _id: paymentId,
      user: session.user.id,
      paymentType: "product",
      method: { $in: ["online", "upi"] },
      notes: "Final product order payment.",
    });

    if (!payment) {
      return response("Payment record not found.", 404);
    }

    if (payment.gatewayOrderId !== razorpayOrderId) {
      return response("Razorpay order mismatch.", 400);
    }

    // 5. Idempotency: only accept a retry for the same payment ID.
    if (payment.status === "paid") {
      if (payment.gatewayPaymentId !== razorpayPaymentId) {
        return response(
          "This payment was completed with a different payment ID.",
          409
        );
      }

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment was already verified.",
      });
    }

    if (payment.status !== "pending") {
      return response("Payment is no longer pending.", 409);
    }

    // 6. Verify the Razorpay signature safely.
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeCompareHex(expectedSignature, razorpaySignature)) {
      return response("Invalid Razorpay signature.", 400);
    }

    // 7. Fetch the payment directly from Razorpay.
    const razorpayPayment =
      await razorpay.payments.fetch(razorpayPaymentId);

    if (
      !razorpayPayment ||
      razorpayPayment.id !== razorpayPaymentId ||
      razorpayPayment.order_id !== razorpayOrderId
    ) {
      return response("Razorpay payment details do not match.", 400);
    }

    if (razorpayPayment.status !== "captured") {
      return response("Razorpay payment has not been captured.", 400);
    }

    if (razorpayPayment.currency !== "INR") {
      return response("Payment currency must be INR.", 400);
    }

    // 8. Validate the associated order and expected balance.
    const order = await ProductOrder.findOne({
      _id: payment.productOrder,
      user: session.user.id,
    });

    if (!order) {
      return response("Product order not found.", 404);
    }

    const remainingAmount = Number(order.remainingAmount || 0);
    const paymentAmount = Number(payment.amount);
    const totalAmount = Number(order.totalAmount);
    const finalPaidAmount = Number(order.finalPaidAmount || 0);

    if (
      !validMoney(remainingAmount) ||
      remainingAmount <= 0 ||
      !validMoney(paymentAmount) ||
      paymentAmount <= 0 ||
      !validMoney(totalAmount) ||
      totalAmount <= 0 ||
      !validMoney(finalPaidAmount) ||
      paymentAmount !== remainingAmount ||
      Number(razorpayPayment.amount) !==
        Math.round(paymentAmount * 100) ||
      finalPaidAmount + paymentAmount > totalAmount
    ) {
      return response("Payment amount does not match the remaining balance.", 400);
    }

    if (
      order.orderStatus === "pending_payment" ||
      order.orderStatus === "cancelled" ||
      order.paymentStatus === "paid"
    ) {
      return response("This order is no longer eligible for final payment.", 409);
    }

    // 9. Atomically update the payment and order.
    dbSession = await mongoose.startSession();

    let result = null;

    await dbSession.withTransaction(async () => {
      result = null;

      const currentPayment = await Payment.findById(paymentId)
        .session(dbSession);

      if (!currentPayment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      if (
        currentPayment.user.toString() !== session.user.id ||
        currentPayment.paymentType !== "product" ||
        !["online", "upi"].includes(currentPayment.method) ||
        currentPayment.gatewayOrderId !== razorpayOrderId
      ) {
        throw new Error("PAYMENT_MISMATCH");
      }

      if (currentPayment.status === "paid") {
        if (currentPayment.gatewayPaymentId !== razorpayPaymentId) {
          throw new Error("PAYMENT_ID_CONFLICT");
        }

        result = {
          alreadyProcessed: true,
          payment: currentPayment,
        };

        return;
      }

      if (currentPayment.status !== "pending") {
        throw new Error("PAYMENT_NOT_PENDING");
      }

      const currentOrder = await ProductOrder.findOne({
        _id: currentPayment.productOrder,
        user: session.user.id,
      }).session(dbSession);

      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const currentRemaining = Number(
        currentOrder.remainingAmount || 0
      );
      const currentTotal = Number(currentOrder.totalAmount);
      const currentFinalPaid = Number(
        currentOrder.finalPaidAmount || 0
      );
      const currentPaymentAmount = Number(currentPayment.amount);

      if (
        currentOrder.orderStatus === "pending_payment" ||
        currentOrder.orderStatus === "cancelled" ||
        currentOrder.paymentStatus === "paid" ||
        !validMoney(currentRemaining) ||
        !validMoney(currentTotal) ||
        !validMoney(currentFinalPaid) ||
        currentRemaining <= 0 ||
        currentPaymentAmount !== currentRemaining ||
        currentFinalPaid + currentPaymentAmount > currentTotal ||
        Number(razorpayPayment.amount) !==
          Math.round(currentPaymentAmount * 100)
      ) {
        throw new Error("AMOUNT_OR_ORDER_MISMATCH");
      }

      const now = new Date();

      currentPayment.status = "paid";
      currentPayment.method = "online";
      currentPayment.gatewayPaymentId = razorpayPaymentId;
      currentPayment.paidAt = now;
      currentPayment.transactionId =
        currentPayment.transactionId || razorpayPaymentId;

      currentOrder.finalPaidAmount = Number(
        (currentFinalPaid + currentPaymentAmount).toFixed(2)
      );
      currentOrder.remainingAmount = 0;
      currentOrder.finalPaymentMethod = "online";
      currentOrder.finalPaymentStatus = "paid";
      currentOrder.paymentStatus = "paid";
      currentOrder.finalPaidAt = now;

      await currentPayment.save({ session: dbSession });
      await currentOrder.save({ session: dbSession });

      result = {
        alreadyProcessed: false,
        payment: currentPayment,
        order: currentOrder,
        amount: currentPaymentAmount,
      };
    });

    await dbSession.endSession();
    dbSession = null;

    if (result?.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment was already verified.",
      });
    }

    // 10. Notify only after the database transaction succeeds.
    try {
      await createNotification({
        user: result.order.user,
        type: "payment",
        title: "Final Payment Successful",
        message: `Your final payment of ₹${result.amount.toLocaleString("en-IN")} has been received. Your product order is fully paid.`,
        productOrder: result.order._id,
        link: `/orders/${result.order._id}`,
      });
    } catch (notificationError) {
      console.error(
        "FINAL PRODUCT PAYMENT NOTIFICATION ERROR:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Final payment verified successfully.",
      payment: {
        id: result.payment._id.toString(),
        amount: result.payment.amount,
        status: result.payment.status,
        gatewayPaymentId: result.payment.gatewayPaymentId,
      },
      order: {
        id: result.order._id.toString(),
        finalPaidAmount: result.order.finalPaidAmount,
        remainingAmount: result.order.remainingAmount,
        paymentStatus: result.order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("FINAL PRODUCT PAYMENT VERIFY ERROR:", error);

    const knownErrors = {
      PAYMENT_NOT_FOUND: ["Payment record not found.", 404],
      PAYMENT_MISMATCH: ["Payment details do not match.", 400],
      PAYMENT_ID_CONFLICT: [
        "Payment was completed with a different payment ID.",
        409,
      ],
      PAYMENT_NOT_PENDING: ["Payment is no longer pending.", 409],
      ORDER_NOT_FOUND: ["Product order not found.", 404],
      AMOUNT_OR_ORDER_MISMATCH: [
        "Payment amount or order status no longer matches.",
        409,
      ],
    };

    const known = knownErrors[error?.message];

    if (known) {
      return response(known[0], known[1]);
    }

    return response("Final payment verification failed.", 500);
  } finally {
    if (dbSession) {
      try {
        await dbSession.endSession();
      } catch (error) {
        console.error("FAILED TO CLOSE PAYMENT SESSION:", error);
      }
    }
  }
}
