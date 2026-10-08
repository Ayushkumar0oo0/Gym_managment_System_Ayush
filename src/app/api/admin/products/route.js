import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    // --------------------------------
    // Check authentication
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
    // Admin only
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

    await connectDB();

    // --------------------------------
    // Get products
    // --------------------------------

    const products = await Product.find()
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load products.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // --------------------------------
    // Check authentication
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
    // Admin only
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
    // Read request
    // --------------------------------

    const body = await request.json();

    const name = body.name?.trim();

    const description =
      body.description?.trim() || "";

    const imageUrl =
      body.imageUrl?.trim();

    const originalPrice = Number(
      body.originalPrice
    );

    const price = Number(body.price);

    const isActive =
      body.isActive !== false;

    // --------------------------------
    // Validate name
    // --------------------------------

    if (!name || name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product name must be at least 2 characters.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Validate image
    // --------------------------------

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product image is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Validate original price
    // --------------------------------

    if (
      !Number.isFinite(
        originalPrice
      ) ||
      originalPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid market price.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Validate selling price
    // --------------------------------

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid selling price.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Selling price cannot be higher
    // than market price
    // --------------------------------

    if (price > originalPrice) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selling price cannot be greater than market price.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // --------------------------------
    // Create product
    // --------------------------------

    const product =
      await Product.create({
        name,
        description,
        imageUrl,
        originalPrice,
        price,
        isActive,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Product created successfully.",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCTS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create product.",
      },
      { status: 500 }
    );
  }
}