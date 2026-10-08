import { NextResponse } from "next/server";
import crypto from "crypto";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";

import Payment from "@/models/Payment";
import ProductOrder from "@/models/ProductOrder";

export async function POST(request) {
  try {
    // 1. Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // 2. Read request body
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
          message: "Payment information is incomplete.",
        },
        { status: 400 }
      );
    }

    // 3. Connect database
    await connectDB();

    // 4. Find payment belonging to this member
    const payment = await Payment.findOne({
      _id: paymentId,
      user: session.user.id,
      paymentType: "product",
      method: "upi",
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found.",
        },
        { status: 404 }
      );
    }

    // 5. Prevent duplicate verification
    if (payment.status === "paid") {
      return NextResponse.json(
        {
          success: true,
          message: "Payment has already been verified.",
        },
        { status: 200 }
      );
    }

    // 6. Make sure Razorpay order belongs to our payment
    if (
      payment.gatewayOrderId !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Razorpay order.",
        },
        { status: 400 }
      );
    }

    // 7. Verify Razorpay signature
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

    if (
      generatedSignature !==
      razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature.",
        },
        { status: 400 }
      );
    }

    // 8. Find product order
    const productOrder =
      await ProductOrder.findOne({
        _id: payment.productOrder,
        user: session.user.id,
      });

    if (!productOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Product order not found.",
        },
        { status: 404 }
      );
    }

    // 9. Make sure the order is still awaiting initial payment
    if (
      productOrder.initialPaymentStatus !==
      "pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Initial payment has already been processed.",
        },
        { status: 400 }
      );
    }

    // 10. Mark payment as paid
    payment.status = "paid";
    payment.gatewayPaymentId =
      razorpayPaymentId;
    payment.paidAt = new Date();

    await payment.save();

    // 11. Update product order
    const initialAmount = Number(
      productOrder.initialPaymentAmount
    );

    const remainingAmount = Number(
      productOrder.remainingAmount
    );

    productOrder.initialPaymentStatus =
      "paid";

    productOrder.initialPaidAmount =
      initialAmount;

    productOrder.initialPaidAt =
      new Date();

    productOrder.initialPaymentConfirmedBy =
      null;

    productOrder.paymentStatus =
      remainingAmount > 0
        ? "partially_paid"
        : "paid";

    productOrder.orderStatus =
      "ordered";

    await productOrder.save();

    // 12. Create notification
    try {
      await createNotification({
        user: productOrder.user,

        type: "payment",

        title: "Initial Payment Successful",

        message:
          remainingAmount > 0
            ? `Your initial payment of ₹${initialAmount.toLocaleString(
                "en-IN"
              )} has been received successfully. Your product order has been placed. Remaining amount: ₹${remainingAmount.toLocaleString(
                "en-IN"
              )}.`
            : `Your payment of ₹${initialAmount.toLocaleString(
                "en-IN"
              )} has been received successfully. Your product order has been placed.`,

        productOrder: productOrder._id,

        link: `/orders/${productOrder._id}`,
      });
    } catch (notificationError) {
      console.error(
        "CREATE INITIAL PAYMENT NOTIFICATION ERROR:",
        notificationError
      );
    }

    // 13. Return success
    return NextResponse.json(
      {
        success: true,
        message:
          remainingAmount > 0
            ? "Initial payment successful. Your order has been placed."
            : "Payment successful. Your order has been placed.",

        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          gatewayPaymentId:
            payment.gatewayPaymentId,
        },

        order: {
          id: productOrder._id,
          initialPaidAmount:
            productOrder.initialPaidAmount,
          remainingAmount:
            productOrder.remainingAmount,
          paymentStatus:
            productOrder.paymentStatus,
          orderStatus:
            productOrder.orderStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PRODUCT RAZORPAY VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}