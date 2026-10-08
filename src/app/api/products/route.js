import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      isActive: true,
    })
      .select(
        "name description imageUrl originalPrice price createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    const formattedProducts =
      products.map((product) => {
        const originalPrice =
          Number(
            product.originalPrice ??
              product.price
          ) || 0;

        const price =
          Number(product.price) || 0;

        const savings =
          originalPrice > price
            ? originalPrice - price
            : 0;

        const discountPercentage =
          originalPrice > 0 &&
          price < originalPrice
            ? Math.round(
                ((originalPrice - price) /
                  originalPrice) *
                  100
              )
            : 0;

        return {
          ...product,

          originalPrice,

          price,

          savings,

          discountPercentage,
        };
      });

    return NextResponse.json(
      {
        success: true,
        products: formattedProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUBLIC PRODUCTS GET ERROR:",
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