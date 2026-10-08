import { NextResponse } from "next/server";
import crypto from "crypto";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Payment from "@/models/Payment";
import ProductOrder from "@/models/ProductOrder";

export async function POST(request) {
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
    // 2. Read request body
    // ----------------------------------------
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
          message: "Payment verification data is incomplete.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 3. Connect database
    // ----------------------------------------
    await connectDB();

    // ----------------------------------------
    // 4. Find our Payment record
    // ----------------------------------------
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------
    // 5. Make sure payment belongs to user
    // ----------------------------------------
    if (
      payment.user.toString() !==
      session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to verify this payment.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // 6. Make sure this is a product payment
    // ----------------------------------------
    if (payment.paymentType !== "product") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment type.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 7. Make sure this is a UPI payment
    // ----------------------------------------
    if (payment.method !== "upi") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 8. Make sure Razorpay order matches
    // ----------------------------------------
    if (
      payment.gatewayOrderId !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay order mismatch.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 9. If already paid, don't process again
    // ----------------------------------------
    if (payment.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified.",
      });
    }

    // ----------------------------------------
    // 10. Verify Razorpay signature
    // ----------------------------------------
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

    const signaturesMatch =
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpaySignature)
      );

    if (!signaturesMatch) {
      payment.status = "failed";
      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Invalid Razorpay signature.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 11. Find ProductOrder
    // ----------------------------------------
    const order = await ProductOrder.findById(
      payment.productOrder
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

    // ----------------------------------------
    // 12. Make sure order belongs to user
    // ----------------------------------------
    if (
      order.user.toString() !==
      session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ownership mismatch.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // 13. Make sure money is still due
    // ----------------------------------------
    const remainingAmount = Number(
      order.remainingAmount || 0
    );

    if (remainingAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been fully paid.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 14. Verify payment amount
    // ----------------------------------------
    if (
      Number(payment.amount) !==
      remainingAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount mismatch.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 15. Update Payment
    // ----------------------------------------
    payment.status = "paid";
    payment.gatewayPaymentId =
      razorpayPaymentId;
    payment.paidAt = new Date();

    await payment.save();

    // ----------------------------------------
    // 16. Update ProductOrder
    // ----------------------------------------
    order.finalPaidAmount = Number(
      order.finalPaidAmount || 0
    ) + remainingAmount;

    order.remainingAmount = 0;

    order.finalPaymentMethod = "upi";

    order.finalPaymentStatus = "paid";

    order.paymentStatus = "paid";

    order.finalPaidAt = new Date();

    await order.save();

    // ----------------------------------------
    // 17. Return success
    // ----------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Final payment verified successfully.",

        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          gatewayPaymentId:
            payment.gatewayPaymentId,
        },

        order: {
          id: order._id,
          finalPaidAmount:
            order.finalPaidAmount,
          remainingAmount:
            order.remainingAmount,
          paymentStatus:
            order.paymentStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FINAL PRODUCT PAYMENT VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to verify final payment.",
      },
      { status: 500 }
    );
  }
}