import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import ProductOrder from "@/models/ProductOrder";
import Product from "@/models/Product";

export async function GET(request, { params }) {
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
    // 2. Member only
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
    // 3. Get order ID
    // ------------------------------------

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------
    // 4. Connect database
    // ------------------------------------

    await connectDB();

    // ------------------------------------
    // 5. Find order
    // ------------------------------------
    //
    // IMPORTANT:
    //
    // user: session.user.id
    //
    // prevents a member from seeing
    // another member's order.
    //
    // ------------------------------------

    const order =
      await ProductOrder.findOne({
        _id: id,
        user: session.user.id,
      })
        .populate(
          "product",
          "name description imageUrl originalPrice price"
        )
        .lean();

    // ------------------------------------
    // 6. Order not found
    // ------------------------------------

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------
    // 7. Calculate current values
    // ------------------------------------

    const totalAmount =
      Number(order.totalAmount) || 0;

    const initialPaidAmount =
      Number(
        order.initialPaidAmount
      ) || 0;

    const finalPaidAmount =
      Number(
        order.finalPaidAmount
      ) || 0;

    const totalPaid =
      initialPaidAmount +
      finalPaidAmount;

    const calculatedRemaining =
      Math.max(
        totalAmount - totalPaid,
        0
      );

    // ------------------------------------
    // 8. Return order
    // ------------------------------------

    return NextResponse.json(
      {
        success: true,

        order: {
          ...order,

          totalPaid,

          remainingAmount:
            calculatedRemaining,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER PRODUCT ORDER GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load order.",
      },
      { status: 500 }
    );
  }
}