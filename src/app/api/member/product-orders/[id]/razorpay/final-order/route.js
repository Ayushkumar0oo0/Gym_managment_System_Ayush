import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import ProductOrder from "@/models/ProductOrder";
import Payment from "@/models/Payment";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request, { params }) {
  try {
    // ----------------------------------------
    // 1. Check authentication
    // ----------------------------------------
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

    // ----------------------------------------
    // 2. Get order ID
    // ----------------------------------------
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product order ID is required.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 3. Connect database
    // ----------------------------------------
    await connectDB();

    // ----------------------------------------
    // 4. Find product order
    // ----------------------------------------
    const order = await ProductOrder.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Product order not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------
    // 5. Make sure order belongs to member
    // ----------------------------------------
    if (order.user.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to pay for this order.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // 6. Check remaining amount
    // ----------------------------------------
    const remainingAmount = Number(
      order.remainingAmount || 0
    );

    if (remainingAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "There is no remaining amount to pay.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 7. Check payment status
    // ----------------------------------------
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "This order is already fully paid.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 8. Check whether a pending final
    //    UPI payment already exists
    // ----------------------------------------
    const existingPayment = await Payment.findOne({
      user: session.user.id,
      productOrder: order._id,
      paymentType: "product",
      method: "upi",
      status: "pending",
      gatewayOrderId: {
        $ne: null,
      },
    }).sort({ createdAt: -1 });

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: "Existing Razorpay order found.",
        paymentId: existingPayment._id,
        razorpayOrderId: existingPayment.gatewayOrderId,
        amount: existingPayment.amount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    // ----------------------------------------
    // 9. Convert amount to paise
    // ----------------------------------------
    const amountInPaise = Math.round(
      remainingAmount * 100
    );

    if (amountInPaise <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment amount.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 10. Create Razorpay order
    // ----------------------------------------
    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `product_final_${order._id.toString()}`,
        notes: {
          productOrderId: order._id.toString(),
          userId: session.user.id,
          paymentType: "product_final",
        },
      });

    // ----------------------------------------
    // 11. Create pending Payment record
    // ----------------------------------------
    const payment = await Payment.create({
      user: session.user.id,

      productOrder: order._id,

      paymentType: "product",

      amount: remainingAmount,

      method: "upi",

      status: "pending",

      gatewayOrderId: razorpayOrder.id,

      gatewayPaymentId: null,

      notes: "Final product order payment.",
    });

    // ----------------------------------------
    // 12. Return Razorpay information
    // ----------------------------------------
    return NextResponse.json(
      {
        success: true,

        paymentId: payment._id,

        razorpayOrderId: razorpayOrder.id,

        amount: remainingAmount,

        currency: "INR",

        key: process.env.RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FINAL PRODUCT RAZORPAY ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to create final payment order.",
      },
      { status: 500 }
    );
  }
}