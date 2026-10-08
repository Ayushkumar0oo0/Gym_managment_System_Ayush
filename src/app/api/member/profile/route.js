import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
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

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select(
        "name email phone role isActive registrationFeePaid registrationFeePaidAt createdAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER PROFILE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load profile.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
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

    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    if (!name || name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be at least 2 characters.",
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Name cannot exceed 100 characters.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
      );
    }

    if (email.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Email cannot exceed 150 characters.",
        },
        { status: 400 }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number must contain exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const duplicateEmail = await User.findOne({
      email,
      _id: {
        $ne: session.user.id,
      },
    }).lean();

    if (duplicateEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is already in use.",
        },
        { status: 409 }
      );
    }

    const duplicatePhone = await User.findOne({
      phone,
      _id: {
        $ne: session.user.id,
      },
    }).lean();

    if (duplicatePhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number is already in use.",
        },
        { status: 409 }
      );
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          name,
          email,
          phone,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "name email phone role isActive registrationFeePaid registrationFeePaidAt createdAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully.",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "MEMBER PROFILE PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile.",
      },
      { status: 500 }
    );
  }
}