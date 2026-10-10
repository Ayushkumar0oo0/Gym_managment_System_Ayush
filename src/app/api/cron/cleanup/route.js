
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Feedback from "@/models/Feedback";
import Membership from "@/models/Membership";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    // Protect the cleanup endpoint.
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("CRON_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          message: "Cron secret is not configured.",
        },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    await connectDB();

    const now = new Date();

    // ---------------------------------------------------------
    // 1. Delete feedback older than 14 days
    // ---------------------------------------------------------

    const feedbackCutoff = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000
    );

    const feedbackDeleteResult = await Feedback.deleteMany({
      createdAt: { $lt: feedbackCutoff },
    });

    // ---------------------------------------------------------
    // 2. Find active accounts whose latest membership
    //    expired more than 90 days ago.
    //
    // Do not set isActive to false here. That field is reserved
    // for account activation/admin blocking.
    // ---------------------------------------------------------

    const inactiveCutoff = new Date(
      now.getTime() - 90 * 24 * 60 * 60 * 1000
    );

    const activeMembers = await User.find({
      role: "member",
      isActive: true,
      membershipAccessLocked: { $ne: true },
    })
      .select("_id")
      .lean();

    const memberIds = activeMembers.map((member) => member._id);

    let lockedMemberIds = [];

    if (memberIds.length > 0) {
      // Memberships where the user is the primary member.
      const primaryMemberships = await Membership.aggregate([
        {
          $match: {
            user: { $in: memberIds },
            endDate: { $ne: null },
            endDate: { $exists: true },
          },
        },
        { $sort: { endDate: -1 } },
        {
          $group: {
            _id: "$user",
            latestEndDate: { $first: "$endDate" },
          },
        },
      ]);

      // Memberships where the user is a secondary/couple member.
      const secondaryMemberships = await Membership.aggregate([
        {
          $match: {
            secondaryUser: { $in: memberIds },
            endDate: { $ne: null },
            endDate: { $exists: true },
          },
        },
        { $sort: { endDate: -1 } },
        {
          $group: {
            _id: "$secondaryUser",
            latestEndDate: { $first: "$endDate" },
          },
        },
      ]);

      // Keep the newest end date for each member.
      const latestByUser = new Map();

      for (const membership of primaryMemberships) {
        latestByUser.set(
          membership._id.toString(),
          new Date(membership.latestEndDate)
        );
      }

      for (const membership of secondaryMemberships) {
        const userId = membership._id.toString();
        const existingDate = latestByUser.get(userId);
        const newDate = new Date(membership.latestEndDate);

        if (!existingDate || newDate > existingDate) {
          latestByUser.set(userId, newDate);
        }
      }

      lockedMemberIds = Array.from(latestByUser.entries())
        .filter(([, latestEndDate]) => latestEndDate <= inactiveCutoff)
        .map(([userId]) => userId);
    }

    // ---------------------------------------------------------
    // 3. Lock membership access without blocking login.
    //
    // Only lock accounts that are still active and have not
    // already been locked by this membership-expiry process.
    // ---------------------------------------------------------

    let lockResult = { modifiedCount: 0 };

    if (lockedMemberIds.length > 0) {
      lockResult = await User.updateMany(
        {
          _id: { $in: lockedMemberIds },
          role: "member",
          isActive: true,
          membershipAccessLocked: { $ne: true },
        },
        {
          $set: {
            membershipAccessLocked: true,
          },
        }
      );
    }

    // ---------------------------------------------------------
    // 4. Return cleanup report
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully.",
      cleanup: {
        feedbackDeleted: feedbackDeleteResult.deletedCount,
        membersLocked: lockResult.modifiedCount,
        feedbackOlderThanDays: 14,
        membershipAccessLockedAfterExpiryDays: 90,
      },
    });
  } catch (error) {
    console.error("CRON CLEANUP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Cleanup failed.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
