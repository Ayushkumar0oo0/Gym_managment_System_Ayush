import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import ProductOrder from "@/models/ProductOrder";

const ALLOWED_PAYMENT_PERCENTAGES = [
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
];

const ALLOWED_PAYMENT_METHODS = [
  "cash",
  "upi",
];

// ========================================
// GET
// Get all product orders of logged-in member
// ========================================

export async function GET() {
  try {
    // ------------------------------------
    // 1. Check authentication
    // ------------------------------------

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ------------------------------------
    // 2. Only members
    // ------------------------------------

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------
    // 3. Connect database
    // ------------------------------------

    await connectDB();

    // ------------------------------------
    // 4. Get member's orders
    // ------------------------------------

    const orders =
      await ProductOrder.find({
        user: session.user.id,
      })
        .populate(
          "product",
          "name description imageUrl originalPrice price"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    // ------------------------------------
    // 5. Return orders
    // ------------------------------------

    return NextResponse.json(
      {
        success: true,
        orders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER PRODUCT ORDERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load your product orders.",
      },
      { status: 500 }
    );
  }
}

// ========================================
// POST
// Create new product order
// ========================================

export async function POST(request) {
  try {
    // ------------------------------------
    // 1. Check authentication
    // ------------------------------------

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ------------------------------------
    // 2. Only members can order
    // ------------------------------------

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only members can place product orders.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------
    // 3. Read request body
    // ------------------------------------

    const body = await request.json();

    const productId =
      body.productId;

    const quantity =
      Number(body.quantity);

    const initialPaymentPercentage =
      Number(
        body.initialPaymentPercentage
      );

    const initialPaymentMethod =
      body.initialPaymentMethod;

    const memberNotes =
      typeof body.memberNotes === "string"
        ? body.memberNotes.trim()
        : "";

    // ------------------------------------
    // 4. Validate product ID
    // ------------------------------------

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product is required.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------
    // 5. Validate quantity
    // ------------------------------------

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quantity must be at least 1.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------
    // 6. Validate payment percentage
    // ------------------------------------

    if (
      !ALLOWED_PAYMENT_PERCENTAGES.includes(
        initialPaymentPercentage
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Initial payment must be between 30% and 100%.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------
    // 7. Validate payment method
    // ------------------------------------

    if (
      !ALLOWED_PAYMENT_METHODS.includes(
        initialPaymentMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment method must be cash or UPI.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------
    // 8. Connect database
    // ------------------------------------

    await connectDB();

    // ------------------------------------
    // 9. Find active product
    // ------------------------------------

    const product =
      await Product.findOne({
        _id: productId,
        isActive: true,
      }).lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product is not available.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------
    // 10. Validate product price
    // ------------------------------------

    const productPrice =
      Number(product.price);

    if (
      !Number.isFinite(productPrice) ||
      productPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product has an invalid price.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------
    // 11. Calculate total
    // ------------------------------------

    const totalAmount =
      productPrice * quantity;

    // ------------------------------------
    // 12. Calculate initial payment
    // ------------------------------------

    const initialPaymentAmount =
      Math.round(
        (totalAmount *
          initialPaymentPercentage) /
          100
      );

    // ------------------------------------
    // 13. Calculate remaining amount
    // ------------------------------------

    const remainingAmount =
      totalAmount -
      initialPaymentAmount;

    // ------------------------------------
    // 14. Create order
    // ------------------------------------
    //
    // IMPORTANT:
    //
    // We do NOT mark the initial payment
    // as paid here.
    //
    // Cash:
    // Admin must confirm the cash.
    //
    // UPI:
    // Razorpay payment must be completed
    // and verified by the server.
    //
    // ------------------------------------

    const order =
      await ProductOrder.create({
        user: session.user.id,

        product: product._id,

        quantity,

        priceAtOrder: productPrice,

        totalAmount,

        initialPaymentPercentage,

        initialPaymentAmount,

        initialPaidAmount: 0,

        initialPaymentMethod,

        initialPaymentStatus:
          "pending",

        remainingAmount,

        finalPaymentMethod: null,

        finalPaidAmount: 0,

        finalPaymentStatus:
          "pending",

        paymentStatus: "pending",

        orderStatus:
          "pending_payment",

        memberNotes,
      });

    // ------------------------------------
    // 15. Return created order
    // ------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Product order created successfully.",

        order: {
          _id: order._id,

          product: {
            _id: product._id,
            name: product.name,
            imageUrl: product.imageUrl,
          },

          quantity,

          priceAtOrder:
            productPrice,

          totalAmount,

          initialPaymentPercentage,

          initialPaymentAmount,

          initialPaidAmount: 0,

          remainingAmount,

          initialPaymentMethod,

          initialPaymentStatus:
            order.initialPaymentStatus,

          paymentStatus:
            order.paymentStatus,

          orderStatus:
            order.orderStatus,

          createdAt:
            order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "MEMBER PRODUCT ORDER POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create product order.",
      },
      { status: 500 }
    );
  }
}