import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    })
      .select(
        "name description imageUrl originalPrice price isActive createdAt"
      )
      .lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found or unavailable.",
        },
        { status: 404 }
      );
    }

    const originalPrice =
      Number(product.originalPrice ?? product.price) || 0;

    const price =
      Number(product.price) || 0;

    const savings =
      originalPrice > price
        ? originalPrice - price
        : 0;

    const discountPercentage =
      originalPrice > 0 && price < originalPrice
        ? Math.round(
            ((originalPrice - price) /
              originalPrice) *
              100
          )
        : 0;

    return NextResponse.json(
      {
        success: true,

        product: {
          ...product,

          originalPrice,
          price,
          savings,
          discountPercentage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUBLIC SINGLE PRODUCT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product.",
      },
      { status: 500 }
    );
  }
}