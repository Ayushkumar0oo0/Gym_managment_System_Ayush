
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import razorpay from "@/lib/razorpay";

import ProductOrder from "@/models/ProductOrder";
import Payment from "@/models/Payment";

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
      return errorResponse("Unauthorized.", 401);
    }

    // 2. Validate the order ID.
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return errorResponse("Invalid product order ID.", 400);
    }

    // 3. Connect to MongoDB.
    await connectDB();

    // 4. Find only the member's order.
    const order = await ProductOrder.findOne({
      _id: id,
      user: session.user.id,
    });

    if (!order) {
      return errorResponse("Product order not found.", 404);
    }

    // 5. Ensure the order is eligible for final payment.
    if (
      order.orderStatus === "pending_payment" ||
      order.orderStatus === "cancelled"
    ) {
      return errorResponse(
        "This order is not eligible for final payment.",
        409
      );
    }

    if (order.paymentStatus === "paid") {
      return errorResponse(
        "This order is already fully paid.",
        409
      );
    }

    const remainingAmount = Number(order.remainingAmount || 0);
    const totalAmount = Number(order.totalAmount);

    if (
      !isValidAmount(remainingAmount) ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      remainingAmount > totalAmount
    ) {
      return errorResponse("Invalid remaining payment amount.", 400);
    }

    const amountInPaise = Math.round(remainingAmount * 100);

    // 6. Reuse a pending online payment if its Razorpay order
    // is still open and has the correct amount and currency.
    let payment = await Payment.findOne({
      user: session.user.id,
      productOrder: order._id,
      paymentType: "product",
      method: { $in: ["online", "upi"] },
      status: "pending",
      amount: remainingAmount,
      gatewayOrderId: { $exists: true, $nin: ["", null] },
      notes: "Final product order payment.",
    }).sort({ createdAt: -1 });

    if (payment?.gatewayOrderId) {
      try {
        const existingOrder = await razorpay.orders.fetch(
          payment.gatewayOrderId
        );

        if (
          existingOrder?.id === payment.gatewayOrderId &&
          existingOrder.amount === amountInPaise &&
          existingOrder.currency === "INR" &&
          existingOrder.status === "created"
        ) {
          if (payment.method !== "online") {
            payment.method = "online";
            await payment.save();
          }

          return NextResponse.json({
            success: true,
            reused: true,
            paymentId: payment._id.toString(),
            razorpayOrderId: existingOrder.id,
            amount: payment.amount,
            currency: "INR",
            key: process.env.RAZORPAY_KEY_ID,
          });
        }
      } catch (error) {
        console.error(
          "EXISTING FINAL RAZORPAY ORDER LOOKUP FAILED:",
          error?.message
        );
      }
    }

    // 7. Validate Razorpay configuration.
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

    // 8. Create the final-payment Razorpay order.
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `product_final_${order._id.toString()}`,
      notes: {
        productOrderId: order._id.toString(),
        userId: session.user.id.toString(),
        paymentType: "product_final",
      },
    });

    if (
      !razorpayOrder?.id ||
      razorpayOrder.amount !== amountInPaise ||
      razorpayOrder.currency !== "INR"
    ) {
      console.error("Razorpay returned an unexpected final order.");

      return errorResponse(
        "Could not initialize the final payment.",
        502
      );
    }

    // 9. Update an existing pending record or create one.
    if (payment) {
      payment.gatewayOrderId = razorpayOrder.id;
      payment.gatewayPaymentId = null;
      payment.amount = remainingAmount;
      payment.method = "online";
      payment.status = "pending";
      payment.notes = "Final product order payment.";

      await payment.save();
    } else {
      payment = await Payment.create({
        user: session.user.id,
        productOrder: order._id,
        paymentType: "product",
        amount: remainingAmount,
        method: "online",
        status: "pending",
        gatewayOrderId: razorpayOrder.id,
        gatewayPaymentId: null,
        notes: "Final product order payment.",
      });
    }

    // 10. Return checkout information.
    return NextResponse.json(
      {
        success: true,
        reused: false,
        paymentId: payment._id.toString(),
        razorpayOrderId: razorpayOrder.id,
        amount: remainingAmount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FINAL PRODUCT RAZORPAY ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create final payment order.",
      },
      { status: 500 }
    );
  }
}
