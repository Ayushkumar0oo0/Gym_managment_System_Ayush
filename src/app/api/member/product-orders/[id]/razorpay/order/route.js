import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import razorpay from "@/lib/razorpay";

import ProductOrder from "@/models/ProductOrder";
import Payment from "@/models/Payment";

export async function POST(request, { params }) {
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

    // 2. Get order ID
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

    // 3. Connect database
    await connectDB();

    // 4. Find order belonging to logged-in member
    const productOrder = await ProductOrder.findOne({
      _id: id,
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

    // 5. Initial payment must still be pending
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

    // 6. This route is only for UPI
    if (
      productOrder.initialPaymentMethod !==
      "upi"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order is not configured for UPI payment.",
        },
        { status: 400 }
      );
    }

    // 7. Validate amount from database
    const amount = Number(
      productOrder.initialPaymentAmount
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid initial payment amount.",
        },
        { status: 400 }
      );
    }

    // Razorpay uses paise
    const amountInPaise = Math.round(
      amount * 100
    );

    // 8. Create Razorpay order
    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `product_${productOrder._id}`,
        notes: {
          productOrderId:
            productOrder._id.toString(),
          userId: session.user.id.toString(),
          paymentType: "product",
        },
      });

    // 9. Create pending Payment record
    const payment = await Payment.create({
      user: session.user.id,

      productOrder: productOrder._id,

      paymentType: "product",

      amount: amount,

      method: "upi",

      status: "pending",

      gatewayOrderId:
        razorpayOrder.id,

      notes:
        "Initial product order payment",
    });

    // 10. Return Razorpay information
    return NextResponse.json(
      {
        success: true,

        payment: {
          id: payment._id.toString(),
          amount: payment.amount,
          status: payment.status,
        },

        razorpay: {
          keyId:
            process.env.RAZORPAY_KEY_ID,
          orderId:
            razorpayOrder.id,
          amount:
            razorpayOrder.amount,
          currency:
            razorpayOrder.currency,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PRODUCT RAZORPAY ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}