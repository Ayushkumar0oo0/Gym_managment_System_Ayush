
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
      return response("You must be logged in.", 401);
    }

    // 2. Parse and validate the request.
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
      return response("Online payment verification is unavailable.", 503);
    }

    // 3. Connect to the database.
    await connectDB();

    // 4. Find the payment and check ownership.
    const payment = await Payment.findOne({
      _id: paymentId,
      user: session.user.id,
      paymentType: "product",
      method: { $in: ["online", "upi"] },
    });

    if (!payment) {
      return response("Payment record not found.", 404);
    }

    if (payment.gatewayOrderId !== razorpayOrderId) {
      return response("Razorpay order ID does not match.", 400);
    }

    // A retry is successful only for the same Razorpay payment.
    if (payment.status === "paid") {
      if (payment.gatewayPaymentId !== razorpayPaymentId) {
        return response(
          "This payment was already completed with a different payment ID.",
          409
        );
      }

      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment was already verified.",
        payment: {
          id: payment._id.toString(),
          status: payment.status,
          gatewayPaymentId: payment.gatewayPaymentId,
        },
      });
    }

    if (payment.status !== "pending") {
      return response(
        `Payment cannot be verified because its status is ${payment.status}.`,
        409
      );
    }

    // 5. Verify the Razorpay signature.
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeCompareHex(expectedSignature, razorpaySignature)) {
      return response("Invalid Razorpay payment signature.", 400);
    }

    // 6. Fetch payment details directly from Razorpay.
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
      return response("Razorpay payment currency must be INR.", 400);
    }

    // 7. Check the product order and expected initial amount.
    const order = await ProductOrder.findOne({
      _id: payment.productOrder,
      user: session.user.id,
    });

    if (!order) {
      return response("Product order not found.", 404);
    }

    const initialAmount = Number(order.initialPaymentAmount);
    const storedPaymentAmount = Number(payment.amount);
    const totalAmount = Number(order.totalAmount);

    if (
      !validMoney(initialAmount) ||
      initialAmount <= 0 ||
      !validMoney(storedPaymentAmount) ||
      storedPaymentAmount <= 0 ||
      !validMoney(totalAmount) ||
      totalAmount <= 0 ||
      initialAmount > totalAmount ||
      storedPaymentAmount !== initialAmount
    ) {
      return response("Stored initial payment amount is invalid.", 400);
    }

    if (
      Number(razorpayPayment.amount) !==
      Math.round(initialAmount * 100)
    ) {
      return response(
        "Razorpay payment amount does not match the initial payment.",
        400
      );
    }

   if (!["online", "upi"].includes(order.initialPaymentMethod)) {
  return response(
    "This order is not configured for online payment.",
    400
  );
}

    // 8. Update payment and order atomically.
    dbSession = await mongoose.startSession();

    let transactionResult = null;

    await dbSession.withTransaction(async () => {
      // Reset values because MongoDB may retry this callback.
      transactionResult = null;

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
        if (
          currentPayment.gatewayPaymentId !== razorpayPaymentId
        ) {
          throw new Error("PAYMENT_ID_CONFLICT");
        }

        transactionResult = {
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

      if (
        currentOrder.orderStatus !== "pending_payment" ||
        currentOrder.initialPaymentStatus !== "pending" ||
        !["online", "upi"].includes(currentOrder.initialPaymentMethod)
      ) {
        throw new Error("ORDER_NOT_PENDING");
      }

      const currentInitialAmount =
        Number(currentOrder.initialPaymentAmount);
      const currentTotal = Number(currentOrder.totalAmount);
      const currentInitialPaid =
        Number(currentOrder.initialPaidAmount || 0);
      const currentFinalPaid =
        Number(currentOrder.finalPaidAmount || 0);
      const currentPaymentAmount =
        Number(currentPayment.amount);

      if (
        !validMoney(currentInitialAmount) ||
        !validMoney(currentTotal) ||
        !validMoney(currentInitialPaid) ||
        !validMoney(currentFinalPaid) ||
        currentInitialAmount <= 0 ||
        currentInitialAmount > currentTotal ||
        currentPaymentAmount !== currentInitialAmount ||
        currentInitialPaid !== 0 ||
        currentFinalPaid < 0 ||
        currentInitialAmount + currentFinalPaid > currentTotal
      ) {
        throw new Error("AMOUNT_MISMATCH");
      }

      if (
        Number(razorpayPayment.amount) !==
        Math.round(currentPaymentAmount * 100)
      ) {
        throw new Error("AMOUNT_MISMATCH");
      }

      const now = new Date();
      const remainingAmount = Number(
        (
          currentTotal -
          currentInitialAmount -
          currentFinalPaid
        ).toFixed(2)
      );

      currentPayment.status = "paid";
      currentPayment.gatewayPaymentId = razorpayPaymentId;
      currentPayment.paidAt = now;
      currentPayment.transactionId =
        currentPayment.transactionId || razorpayPaymentId;

      currentOrder.initialPaymentStatus = "paid";
      currentOrder.initialPaidAmount = currentInitialAmount;
      currentOrder.initialPaidAt = now;
      currentOrder.initialPaymentConfirmedBy = null;
      currentOrder.remainingAmount = remainingAmount;
      currentOrder.paymentStatus =
        remainingAmount === 0 ? "paid" : "partially_paid";
      currentOrder.orderStatus = "ordered";

      await currentPayment.save({ session: dbSession });
      await currentOrder.save({ session: dbSession });

      transactionResult = {
        alreadyProcessed: false,
        payment: currentPayment,
        order: currentOrder,
        initialAmount: currentInitialAmount,
        remainingAmount,
      };
    });

    await dbSession.endSession();
    dbSession = null;

    if (transactionResult?.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment was already verified.",
        payment: {
          id: transactionResult.payment._id.toString(),
          status: transactionResult.payment.status,
          gatewayPaymentId:
            transactionResult.payment.gatewayPaymentId,
        },
      });
    }

    // 9. Notify only after the database transaction succeeds.
    try {
      const { order: paidOrder, initialAmount: paidAmount, remainingAmount } =
        transactionResult;

      await createNotification({
        user: paidOrder.user,
        type: "payment",
        title: "Initial Payment Successful",
        message:
          remainingAmount > 0
            ? `Your initial payment of ₹${paidAmount.toLocaleString("en-IN")} has been received. Your order has been placed. Remaining amount: ₹${remainingAmount.toLocaleString("en-IN")}.`
            : `Your payment of ₹${paidAmount.toLocaleString("en-IN")} has been received. Your order has been placed.`,
        productOrder: paidOrder._id,
        link: `/orders/${paidOrder._id}`,
      });
    } catch (notificationError) {
      console.error(
        "INITIAL PRODUCT PAYMENT NOTIFICATION ERROR:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Initial payment verified successfully.",
      payment: {
        id: transactionResult.payment._id.toString(),
        status: transactionResult.payment.status,
        amount: transactionResult.payment.amount,
        gatewayPaymentId:
          transactionResult.payment.gatewayPaymentId,
      },
      order: {
        id: transactionResult.order._id.toString(),
        initialPaidAmount:
          transactionResult.order.initialPaidAmount,
        remainingAmount:
          transactionResult.order.remainingAmount,
        paymentStatus:
          transactionResult.order.paymentStatus,
        orderStatus:
          transactionResult.order.orderStatus,
      },
    });
  } catch (error) {
    console.error("INITIAL PRODUCT PAYMENT VERIFY ERROR:", error);

    const knownErrors = {
      PAYMENT_NOT_FOUND: ["Payment record not found.", 404],
      PAYMENT_MISMATCH: ["Payment details do not match.", 400],
      PAYMENT_ID_CONFLICT: [
        "Payment was already completed with a different payment ID.",
        409,
      ],
      PAYMENT_NOT_PENDING: ["Payment is no longer pending.", 409],
      ORDER_NOT_FOUND: ["Product order not found.", 404],
      ORDER_NOT_PENDING: ["Product order is no longer awaiting initial payment.", 409],
      AMOUNT_MISMATCH: ["Payment amount does not match the order.", 400],
    };

    const known = knownErrors[error?.message];

    if (known) {
      return response(known[0], known[1]);
    }

    return response("Payment verification failed.", 500);
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
