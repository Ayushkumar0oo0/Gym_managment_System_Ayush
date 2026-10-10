
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import razorpay from "@/lib/razorpay";

import ProductOrder from "@/models/ProductOrder";
import Payment from "@/models/Payment";

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

function isValidAmount(amount) {
  return (
    Number.isFinite(amount) &&
    amount > 0 &&
    Number.isSafeInteger(Math.round(amount * 100))
  );
}

export async function POST(request, { params }) {
  try {
    // 1. Authenticate the member.
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse("You must be logged in.", 401);
    }

    // 2. Rate limit payment-order creation.
    const clientIp = getClientIp(request);

    const rateLimitResult = await paymentRateLimit.limit(
      createRateLimitIdentifier(
        "initial-product-payment-order",
        `${session.user.id}:${clientIp}`
      )
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // 3. Validate the order ID.
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid product order ID.", 400);
    }

    // 4. Connect to MongoDB.
    await connectDB();

    // 5. Fetch only this member's order.
    const order = await ProductOrder.findOne({
      _id: id,
      user: session.user.id,
    });

    if (!order) {
      return errorResponse("Product order not found.", 404);
    }

    // 6. Ensure the order is eligible for initial payment.
    if (order.orderStatus !== "pending_payment") {
      return errorResponse(
        "This order is no longer awaiting its initial payment.",
        409
      );
    }

    if (order.initialPaymentStatus !== "pending") {
      return errorResponse(
        "Initial payment has already been processed.",
        409
      );
    }

    // Accept new online orders and legacy UPI orders.
    if (
      !["online", "upi"].includes(order.initialPaymentMethod)
    ) {
      return errorResponse(
        "This order is not configured for online payment.",
        400
      );
    }

    // 7. Validate the amount stored in the database.
    const amount = Number(order.initialPaymentAmount);
    const totalAmount = Number(order.totalAmount);

    if (
      !isValidAmount(amount) ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      amount > totalAmount
    ) {
      return errorResponse(
        "The product order payment amount is invalid.",
        400
      );
    }

    const amountInPaise = Math.round(amount * 100);

    // 8. Reuse a pending online or legacy UPI payment.
    let payment = await Payment.findOne({
      user: session.user.id,
      productOrder: order._id,
      paymentType: "product",
      method: { $in: ["online", "upi"] },
      status: "pending",
      amount,
      notes: "Initial product order payment",
      gatewayOrderId: { $exists: true, $ne: "" },
    }).sort({ createdAt: -1 });

    if (payment?.gatewayOrderId) {
      try {
        const existingRazorpayOrder =
          await razorpay.orders.fetch(payment.gatewayOrderId);

        if (
          existingRazorpayOrder &&
          existingRazorpayOrder.id === payment.gatewayOrderId &&
          existingRazorpayOrder.amount === amountInPaise &&
          existingRazorpayOrder.currency === "INR" &&
          existingRazorpayOrder.status === "created"
        ) {
          return NextResponse.json({
            success: true,
            reused: true,
            payment: {
              id: payment._id.toString(),
              amount: payment.amount,
              status: payment.status,
            },
            razorpay: {
              keyId: process.env.RAZORPAY_KEY_ID,
              orderId: existingRazorpayOrder.id,
              amount: existingRazorpayOrder.amount,
              currency: existingRazorpayOrder.currency,
            },
          });
        }
      } catch (error) {
        console.error(
          "EXISTING INITIAL RAZORPAY ORDER LOOKUP FAILED:",
          error?.message
        );
      }
    }

    // 9. Verify Razorpay configuration.
    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      console.error("Razorpay credentials are not configured.");

      return errorResponse(
        "Online payments are temporarily unavailable.",
        503
      );
    }

    // 10. Create a Razorpay order.
    // Do not restrict the Checkout to UPI here.
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `product_${order._id}`,
      notes: {
        productOrderId: order._id.toString(),
        userId: session.user.id.toString(),
        paymentType: "product",
        paymentStage: "initial",
      },
    });

    if (
      !razorpayOrder?.id ||
      razorpayOrder.amount !== amountInPaise ||
      razorpayOrder.currency !== "INR"
    ) {
      console.error("Razorpay returned an unexpected order.");

      return errorResponse(
        "Could not initialize the online payment.",
        502
      );
    }

    // 11. Save the payment record as online.
    if (payment) {
      payment.method = "online";
      payment.gatewayOrderId = razorpayOrder.id;
      payment.amount = amount;
      payment.status = "pending";
      payment.notes = "Initial product order payment";

      await payment.save();
    } else {
      payment = await Payment.create({
        user: session.user.id,
        productOrder: order._id,
        paymentType: "product",
        amount,
        method: "online",
        status: "pending",
        gatewayOrderId: razorpayOrder.id,
        notes: "Initial product order payment",
      });
    }

    // 12. Return Checkout details.
    return NextResponse.json(
      {
        success: true,
        reused: false,
        payment: {
          id: payment._id.toString(),
          amount: payment.amount,
          status: payment.status,
        },
        razorpay: {
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "INITIAL PRODUCT RAZORPAY ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create the online payment order.",
      },
      { status: 500 }
    );
  }
}