import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    await connectDB();

    const product =
      await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCT GET ERROR:",
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

export async function PATCH(request, { params }) {
  try {
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json();

    await connectDB();

    const existingProduct =
      await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------
    // Prepare updated values
    // --------------------------------

    const name =
      body.name !== undefined
        ? body.name.trim()
        : existingProduct.name;

    const description =
      body.description !== undefined
        ? body.description.trim()
        : existingProduct.description;

    const imageUrl =
      body.imageUrl !== undefined
        ? body.imageUrl.trim()
        : existingProduct.imageUrl;

    const originalPrice =
      body.originalPrice !== undefined
        ? Number(body.originalPrice)
        : existingProduct.originalPrice;

    const price =
      body.price !== undefined
        ? Number(body.price)
        : existingProduct.price;

    const isActive =
      body.isActive !== undefined
        ? Boolean(body.isActive)
        : existingProduct.isActive;

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
    // Validate market price
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
    // Selling price cannot exceed
    // market price
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

    // --------------------------------
    // Update product
    // --------------------------------

    existingProduct.name = name;
    existingProduct.description =
      description;
    existingProduct.imageUrl =
      imageUrl;
    existingProduct.originalPrice =
      originalPrice;
    existingProduct.price = price;
    existingProduct.isActive =
      isActive;

    await existingProduct.save();

    return NextResponse.json(
      {
        success: true,
        message:
          "Product updated successfully.",
        product: existingProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCT PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request,
  { params }
) {
  try {
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    await connectDB();

    const product =
      await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message:
          "Product deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCT DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete product.",
      },
      { status: 500 }
    );
  }
}