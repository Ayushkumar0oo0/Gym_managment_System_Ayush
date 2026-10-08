import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Membership from "@/models/Membership";

export async function GET() {
  try {
    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // 2. ADMIN AUTHORIZATION
    // ==========================================

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Admin permission required.",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // 3. DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // 4. DATE RANGE
    // ==========================================

    const now = new Date();

    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // End/start boundary for 15 days from today
    const endOfAlertPeriod = new Date(
      startOfToday
    );

    endOfAlertPeriod.setDate(
      endOfAlertPeriod.getDate() + 16
    );

    // ==========================================
    // 5. FIND RELEVANT MEMBERSHIPS
    // ==========================================
    //
    // We include:
    //
    // - Expired memberships
    // - Memberships expiring today
    // - Memberships expiring within 15 days
    //
    // We don't fetch unrelated old memberships.
    // ==========================================

    const memberships =
      await Membership.find({
        status: {
          $in: ["active", "expired"],
        },

        endDate: {
          $lt: endOfAlertPeriod,
        },
      })
        .populate(
          "user",
          "name email phone isActive"
        )
        .populate(
          "plan",
          "name price durationInDays"
        )
        .sort({
          endDate: 1,
        })
        .lean();

    // ==========================================
    // 6. PREPARE ALERT GROUPS
    // ==========================================

    const alerts = {
      expired: [],
      today: [],
      within3Days: [],
      within7Days: [],
      within15Days: [],
    };

    // ==========================================
    // 7. PROCESS MEMBERSHIPS
    // ==========================================

    memberships.forEach((membership) => {
      if (!membership.user) {
        return;
      }

      const endDate = new Date(
        membership.endDate
      );

      const endDateOnly = new Date(endDate);
      endDateOnly.setHours(0, 0, 0, 0);

      // Difference in milliseconds
      const difference =
        endDateOnly.getTime() -
        startOfToday.getTime();

      // Difference in days
      const differenceInDays = Math.round(
        difference /
          (1000 * 60 * 60 * 24)
      );

      const baseData = {
        membershipId:
          membership._id.toString(),

        member: {
          id: membership.user._id.toString(),
          name: membership.user.name,
          email: membership.user.email,
          phone: membership.user.phone,
          isActive: membership.user.isActive,
        },

        plan: membership.plan
          ? {
              id: membership.plan._id.toString(),
              name: membership.plan.name,
              price: membership.plan.price,
              durationInDays:
                membership.plan.durationInDays,
            }
          : null,

        startDate: membership.startDate,
        endDate: membership.endDate,

        status: membership.status,

        daysRemaining:
          differenceInDays > 0
            ? differenceInDays
            : 0,

        daysOverdue:
          differenceInDays < 0
            ? Math.abs(differenceInDays)
            : 0,
      };

      // ========================================
      // EXPIRED
      // ========================================

      if (differenceInDays < 0) {
        alerts.expired.push(baseData);
        return;
      }

      // ========================================
      // TODAY
      // ========================================

      if (differenceInDays === 0) {
        alerts.today.push(baseData);
        return;
      }

      // ========================================
      // WITHIN 3 DAYS
      // ========================================

      if (differenceInDays <= 3) {
        alerts.within3Days.push(baseData);
        return;
      }

      // ========================================
      // WITHIN 7 DAYS
      // ========================================

      if (differenceInDays <= 7) {
        alerts.within7Days.push(baseData);
        return;
      }

      // ========================================
      // WITHIN 15 DAYS
      // ========================================

      if (differenceInDays <= 15) {
        alerts.within15Days.push(baseData);
      }
    });

    // ==========================================
    // 8. RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        alerts: {
          expired: alerts.expired,
          today: alerts.today,
          within3Days: alerts.within3Days,
          within7Days: alerts.within7Days,
          within15Days: alerts.within15Days,
        },

        counts: {
          expired: alerts.expired.length,
          today: alerts.today.length,
          within3Days:
            alerts.within3Days.length,
          within7Days:
            alerts.within7Days.length,
          within15Days:
            alerts.within15Days.length,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "MEMBERSHIP ALERTS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load membership alerts.",
      },
      {
        status: 500,
      }
    );
  }
}