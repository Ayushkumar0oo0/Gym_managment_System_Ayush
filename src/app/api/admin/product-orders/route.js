import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import ProductOrder from "@/models/ProductOrder";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // --------------------------------
    // 1. Authentication
    // --------------------------------

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

    // --------------------------------
    // 2. Admin only
    // --------------------------------

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    // --------------------------------
    // 3. Database
    // --------------------------------

    await connectDB();

    // --------------------------------
    // 4. Get all product orders
    // --------------------------------

    const orders = await ProductOrder.find()
      .populate("user", "name email phone")
      .populate(
        "product",
        "name imageUrl originalPrice price"
      )
      .populate(
        "initialPaymentConfirmedBy",
        "name email"
      )
      .populate(
        "finalPaymentConfirmedBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    // --------------------------------
    // 5. Calculate payment values
    // --------------------------------

    const formattedOrders = orders.map((order) => {
      const totalAmount = Number(order.totalAmount) || 0;

      const initialPaidAmount =
        Number(order.initialPaidAmount) || 0;

      const finalPaidAmount =
        Number(order.finalPaidAmount) || 0;

      const totalPaid =
        initialPaidAmount + finalPaidAmount;

      const remainingAmount = Math.max(
        totalAmount - totalPaid,
        0
      );

      return {
        ...order,
        totalPaid,
        remainingAmount,
      };
    });

    // --------------------------------
    // 6. Response
    // --------------------------------

    return NextResponse.json(
      {
        success: true,
        orders: formattedOrders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCT ORDERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product orders.",
      },
      { status: 500 }
    );
  }
}