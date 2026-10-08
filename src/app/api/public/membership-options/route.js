import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import MembershipPlan from "@/models/MembershipPlan";
import AddOn from "@/models/AddOn";

export async function GET() {
  try {
    await connectDB();

    const [plans, addOns] = await Promise.all([
      MembershipPlan.find({
        isActive: true,
      })
        .select(
          "_id name description price durationInDays eligibility features"
        )
        .sort({
          durationInDays: 1,
          price: 1,
        })
        .lean(),

      AddOn.find({
        isActive: true,
      })
        .select(
          "_id name description type price"
        )
        .sort({
          type: 1,
          price: 1,
        })
        .lean(),
    ]);

    return NextResponse.json(
      {
        success: true,

        plans,

        addOns,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUBLIC MEMBERSHIP OPTIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load membership options.",
      },
      {
        status: 500,
      }
    );
  }
}