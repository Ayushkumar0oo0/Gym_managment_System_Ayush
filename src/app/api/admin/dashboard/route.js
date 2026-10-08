import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Membership from "@/models/Membership";
import Payment from "@/models/Payment";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date);

  return new Date(
    d.getFullYear(),
    d.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function startOfYear(date) {
  const d = new Date(date);

  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);

  return d;
}

function endOfYear(date) {
  const d = new Date(date);

  return new Date(
    d.getFullYear(),
    11,
    31,
    23,
    59,
    59,
    999
  );
}

function paidPaymentMatch(from = null, to = null) {
  const match = {
    status: "paid",
    paidAt: {
      $ne: null,
    },
  };

  if (from) {
    match.paidAt.$gte = from;
  }

  if (to) {
    match.paidAt.$lte = to;
  }

  return match;
}

async function getRevenue(from = null, to = null) {
  const result = await Payment.aggregate([
    {
      $match: paidPaymentMatch(from, to),
    },

    {
      $group: {
        _id: null,
        revenue: {
          $sum: "$amount",
        },
        transactions: {
          $sum: 1,
        },
      },
    },
  ]);

  return {
    revenue: money(result[0]?.revenue),
    transactions: result[0]?.transactions || 0,
  };
}

async function getRevenueByMethod(
  from = null,
  to = null
) {
  const result = await Payment.aggregate([
    {
      $match: paidPaymentMatch(from, to),
    },

    {
      $group: {
        _id: "$method",
        revenue: {
          $sum: "$amount",
        },
        transactions: {
          $sum: 1,
        },
      },
    },
  ]);

  const data = {
    upi: 0,
    cash: 0,
  };

  for (const item of result) {
    if (item._id === "upi") {
      data.upi = money(item.revenue);
    }

    if (item._id === "cash") {
      data.cash = money(item.revenue);
    }
  }

  return data;
}

async function getRevenueByType(
  from = null,
  to = null
) {
  const result = await Payment.aggregate([
    {
      $match: paidPaymentMatch(from, to),
    },

    {
      $group: {
        _id: "$paymentType",
        revenue: {
          $sum: "$amount",
        },
        transactions: {
          $sum: 1,
        },
      },
    },
  ]);

  const data = {
    registration: 0,
    membership: 0,
    renewal: 0,
    promotion: 0,
    product: 0,
    other: 0,
  };

  for (const item of result) {
    if (
      Object.prototype.hasOwnProperty.call(
        data,
        item._id
      )
    ) {
      data[item._id] = money(item.revenue);
    }
  }

  return data;
}

async function getMonthlyRevenue(year) {
  const start = new Date(year, 0, 1);

  const end = new Date(
    year + 1,
    0,
    1
  );

  const result = await Payment.aggregate([
    {
      $match: {
        status: "paid",
        paidAt: {
          $gte: start,
          $lt: end,
          $ne: null,
        },
      },
    },

    {
      $group: {
        _id: {
          month: {
            $month: "$paidAt",
          },
        },

        revenue: {
          $sum: "$amount",
        },

        transactions: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        "_id.month": 1,
      },
    },
  ]);

  const currentYear =
    new Date().getFullYear();

  const currentMonth =
    new Date().getMonth() + 1;

  const lastMonth =
    year === currentYear
      ? currentMonth
      : 12;

  const monthly = [];

  for (
    let month = 1;
    month <= lastMonth;
    month++
  ) {
    const found = result.find(
      (item) =>
        item._id.month === month
    );

    monthly.push({
      month,
      label: MONTH_NAMES[month - 1],
      revenue: money(found?.revenue),
      transactions:
        found?.transactions || 0,
    });
  }

  return monthly;
}

async function getMembershipCounts() {
  const result = await Membership.aggregate([
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const memberships = {
    total: 0,
    active: 0,
    expired: 0,
    cancelled: 0,
  };

  for (const item of result) {
    const count = item.count || 0;

    memberships.total += count;

    if (
      item._id === "active"
    ) {
      memberships.active = count;
    }

    if (
      item._id === "expired"
    ) {
      memberships.expired = count;
    }

    if (
      item._id === "cancelled"
    ) {
      memberships.cancelled = count;
    }
  }

  return memberships;
}

async function getMemberCounts() {
  const result = await User.aggregate([
    {
      $match: {
        role: "member",
      },
    },

    {
      $group: {
        _id: "$isActive",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const members = {
    total: 0,
    active: 0,
    inactive: 0,
  };

  for (const item of result) {
    const count = item.count || 0;

    members.total += count;

    if (item._id === true) {
      members.active = count;
    }

    if (item._id === false) {
      members.inactive = count;
    }
  }

  return members;
}

async function getPaymentStatusCounts() {
  const result = await Payment.aggregate([
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const stats = {
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
  };

  for (const item of result) {
    const count = item.count || 0;

    stats.total += count;

    if (
      Object.prototype.hasOwnProperty.call(
        stats,
        item._id
      )
    ) {
      stats[item._id] = count;
    }
  }

  return stats;
}

async function getTodayPaymentCount(now) {
  const result = await Payment.countDocuments({
    status: "paid",
    paidAt: {
      $gte: startOfDay(now),
      $lte: endOfDay(now),
    },
  });

  return result;
}

async function getNewMembersThisMonth(
  now
) {
  return User.countDocuments({
    role: "member",
    createdAt: {
      $gte: startOfMonth(now),
      $lte: endOfMonth(now),
    },
  });
}

async function getActiveMembershipsByPlan() {
  const result = await Membership.aggregate([
    {
      $match: {
        status: "active",
      },
    },

    {
      $group: {
        _id: "$plan",
        count: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        count: -1,
      },
    },

    {
      $limit: 5,
    },

    {
      $lookup: {
        from: "membershipplans",
        localField: "_id",
        foreignField: "_id",
        as: "plan",
      },
    },

    {
      $unwind: {
        path: "$plan",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 0,
        planId: "$_id",
        name: {
          $ifNull: [
            "$plan.name",
            "Unknown plan",
          ],
        },
        count: 1,
      },
    },
  ]);

  return result;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    const now = new Date();

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const monthStart =
      startOfMonth(now);

    const monthEnd =
      endOfMonth(now);

    const yearStart =
      startOfYear(now);

    const yearEnd =
      endOfYear(now);

    /*
     * Run independent database operations
     * together for a faster dashboard.
     */
    const [
      members,
      memberships,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      yearRevenue,
      todayTransactions,
      newMembersThisMonth,
      revenueByMethod,
      revenueByType,
      monthly,
      paymentStats,
      activeMembershipsByPlan,
    ] = await Promise.all([
      getMemberCounts(),

      getMembershipCounts(),

      getRevenue(),

      getRevenue(
        todayStart,
        todayEnd
      ),

      getRevenue(
        monthStart,
        monthEnd
      ),

      getRevenue(
        yearStart,
        yearEnd
      ),

      getTodayPaymentCount(now),

      getNewMembersThisMonth(now),

      getRevenueByMethod(
        monthStart,
        monthEnd
      ),

      getRevenueByType(
        monthStart,
        monthEnd
      ),

      getMonthlyRevenue(
        now.getFullYear()
      ),

      getPaymentStatusCounts(),

      getActiveMembershipsByPlan(),
    ]);

    const activeMemberPercentage =
      members.total > 0
        ? money(
            (members.active /
              members.total) *
              100
          )
        : 0;

    const activeMembershipPercentage =
      memberships.total > 0
        ? money(
            (memberships.active /
              memberships.total) *
              100
          )
        : 0;

    const expiredMembershipPercentage =
      memberships.total > 0
        ? money(
            (memberships.expired /
              memberships.total) *
              100
          )
        : 0;

    const averageMonthlyPayment =
      monthRevenue.transactions > 0
        ? money(
            monthRevenue.revenue /
              monthRevenue.transactions
          )
        : 0;

    return NextResponse.json({
      success: true,

      dashboard: {
        members: {
          ...members,

          activePercentage:
            activeMemberPercentage,

          newThisMonth:
            newMembersThisMonth,
        },

        memberships: {
          ...memberships,

          activePercentage:
            activeMembershipPercentage,

          expiredPercentage:
            expiredMembershipPercentage,

          activeByPlan:
            activeMembershipsByPlan,
        },

        revenue: {
          total: totalRevenue.revenue,

          today: todayRevenue.revenue,

          thisMonth:
            monthRevenue.revenue,

          month:
            monthRevenue.revenue,

          year:
            yearRevenue.revenue,

          averageTransaction:
            averageMonthlyPayment,

          transactions: {
            today:
              todayTransactions,

            thisMonth:
              monthRevenue.transactions,

            year:
              yearRevenue.transactions,

            allTime:
              totalRevenue.transactions,
          },

          byMethod:
            revenueByMethod,

          byType:
            revenueByType,
        },

        payments: {
          ...paymentStats,
        },

        monthly,
      },

      meta: {
        generatedAt:
          now.toISOString(),

        timezone:
          Intl.DateTimeFormat().resolvedOptions()
            .timeZone,

        currentYear:
          now.getFullYear(),

        currentMonth:
          now.getMonth() + 1,
      },
    });
  } catch (error) {
    console.error(
      "=== ADMIN DASHBOARD API ERROR ===",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load admin dashboard.",
      },
      {
        status: 500,
      }
    );
  }
}