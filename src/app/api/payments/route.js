import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Payment from "@/models/Payment";
import Promotion from "@/models/Promotion";

export async function GET() {
  try {
    // ---------------------------------
    // Check authentication
    // ---------------------------------

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

    // ---------------------------------
    // Only members
    // ---------------------------------

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------
    // Connect database
    // ---------------------------------

    await connectDB();

    // ---------------------------------
    // Get member payments
    // ---------------------------------

    const payments = await Payment.find({
      user: session.user.id,
    })
      .populate(
        "membership",
        "startDate endDate priceAtPurchase"
      )
      .populate(
        "promotion",
        "title type offerPrice"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    // ---------------------------------
    // Return payments
    // ---------------------------------

    return NextResponse.json(
      {
        success: true,
        payments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER PAYMENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load payment history.",
      },
      { status: 500 }
    );
  }
}