import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";

const PAYMENT_TYPES = [
  "registration",
  "membership",
  "renewal",
  "promotion",
  "product",
  "other",
];

const PAYMENT_METHODS = ["upi", "cash"];

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

function startOfWeek(date) {
  const d = startOfDay(date);

  const day = d.getDay();

  // Monday = first day
  const difference = day === 0 ? 6 : day - 1;

  d.setDate(d.getDate() - difference);

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

function buildMatch(from = null, to = null) {
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
      $match: buildMatch(from, to),
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

async function getRevenueByType(from = null, to = null) {
  const result = await Payment.aggregate([
    {
      $match: buildMatch(from, to),
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

  const data = {};

  for (const type of PAYMENT_TYPES) {
    data[type] = {
      revenue: 0,
      transactions: 0,
    };
  }

  for (const item of result) {
    if (!data[item._id]) {
      data[item._id] = {
        revenue: 0,
        transactions: 0,
      };
    }

    data[item._id] = {
      revenue: money(item.revenue),
      transactions: item.transactions || 0,
    };
  }

  return data;
}

async function getRevenueByMethod(from = null, to = null) {
  const result = await Payment.aggregate([
    {
      $match: buildMatch(from, to),
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

  const data = {};

  for (const method of PAYMENT_METHODS) {
    data[method] = {
      revenue: 0,
      transactions: 0,
    };
  }

  for (const item of result) {
    if (!data[item._id]) {
      data[item._id] = {
        revenue: 0,
        transactions: 0,
      };
    }

    data[item._id] = {
      revenue: money(item.revenue),
      transactions: item.transactions || 0,
    };
  }

  return data;
}

async function getMonthlyRevenue(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

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

  const monthly = [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const lastMonth =
    year === currentYear ? currentMonth : 12;

  for (let month = 1; month <= lastMonth; month++) {
    const found = result.find(
      (item) => item._id.month === month
    );

    monthly.push({
      month,
      label: MONTH_NAMES[month - 1],
      revenue: money(found?.revenue),
      transactions: found?.transactions || 0,
    });
  }

  return monthly;
}

async function getDailyRevenue(from, to) {
  if (!from || !to) {
    return [];
  }

  const difference =
    Math.ceil(
      (to.getTime() - from.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // Daily graph only when range is reasonable.
  if (difference > 90) {
    return [];
  }

  const result = await Payment.aggregate([
    {
      $match: buildMatch(from, to),
    },
    {
      $group: {
        _id: {
          year: {
            $year: "$paidAt",
          },
          month: {
            $month: "$paidAt",
          },
          day: {
            $dayOfMonth: "$paidAt",
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
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
  ]);

  const daily = [];

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const day = cursor.getDate();

    const found = result.find(
      (item) =>
        item._id.year === year &&
        item._id.month === month &&
        item._id.day === day
    );

    daily.push({
      date: cursor.toISOString().slice(0, 10),
      revenue: money(found?.revenue),
      transactions: found?.transactions || 0,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return daily;
}

async function getPaymentStats() {
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
    if (stats[item._id] !== undefined) {
      stats[item._id] = item.count;
    }

    stats.total += item.count;
  }

  return stats;
}

async function getRecentTransactions(limit = 30) {
  const payments = await Payment.find({
    status: "paid",
    paidAt: {
      $ne: null,
    },
  })
    .sort({
      paidAt: -1,
    })
    .limit(limit)
    .populate(
      "user",
      "name email phone"
    )
    .populate(
      "membershipPlan",
      "name price durationInDays"
    )
    .populate(
      "promotion",
      "title type offerPrice"
    )
    .populate(
      "productOrder",
      "orderNumber totalAmount"
    )
    .lean();

  return payments.map((payment) => ({
    id: payment._id.toString(),

    amount: money(payment.amount),

    paymentType: payment.paymentType,

    method: payment.method,

    status: payment.status,

    transactionId:
      payment.transactionId || null,

    gatewayOrderId:
      payment.gatewayOrderId || null,

    gatewayPaymentId:
      payment.gatewayPaymentId || null,

    paidAt: payment.paidAt
      ? payment.paidAt.toISOString()
      : null,

    createdAt: payment.createdAt
      ? payment.createdAt.toISOString()
      : null,

    user: payment.user
      ? {
          id: payment.user._id.toString(),
          name: payment.user.name || "",
          email: payment.user.email || "",
          phone: payment.user.phone || "",
        }
      : null,

    membershipPlan: payment.membershipPlan
      ? {
          id: payment.membershipPlan._id.toString(),
          name: payment.membershipPlan.name,
          price: payment.membershipPlan.price,
          durationInDays:
            payment.membershipPlan.durationInDays,
        }
      : null,

    promotion: payment.promotion
      ? {
          id: payment.promotion._id.toString(),
          title: payment.promotion.title,
          type: payment.promotion.type,
          offerPrice: payment.promotion.offerPrice,
        }
      : null,

    productOrder: payment.productOrder
      ? {
          id: payment.productOrder._id.toString(),
          orderNumber:
            payment.productOrder.orderNumber,
          totalAmount:
            payment.productOrder.totalAmount,
        }
      : null,
  }));
}

function getSelectedRange(range, now, fromParam, toParam) {
  switch (range) {
    case "today":
      return {
        from: startOfDay(now),
        to: endOfDay(now),
      };

    case "7d": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 6);

      return {
        from,
        to: endOfDay(now),
      };
    }

    case "30d": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 29);

      return {
        from,
        to: endOfDay(now),
      };
    }

    case "90d": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 89);

      return {
        from,
        to: endOfDay(now),
      };
    }

    case "month":
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
      };

    case "year":
      return {
        from: startOfYear(now),
        to: endOfYear(now),
      };

    case "custom": {
      if (!fromParam || !toParam) {
        return null;
      }

      const from = new Date(fromParam);
      const to = new Date(toParam);

      if (
        Number.isNaN(from.getTime()) ||
        Number.isNaN(to.getTime())
      ) {
        return null;
      }

      return {
        from: startOfDay(from),
        to: endOfDay(to),
      };
    }

    case "all":
    default:
      return {
        from: null,
        to: null,
      };
  }
}

async function getComparison(from, to) {
  if (!from || !to) {
    return null;
  }

  const duration =
    to.getTime() - from.getTime();

  const previousTo = new Date(
    from.getTime() - 1
  );

  const previousFrom = new Date(
    previousTo.getTime() - duration
  );

  const current = await getRevenue(from, to);

  const previous = await getRevenue(
    previousFrom,
    previousTo
  );

  let growth = 0;

  if (previous.revenue === 0) {
    growth =
      current.revenue > 0 ? 100 : 0;
  } else {
    growth = money(
      ((current.revenue -
        previous.revenue) /
        previous.revenue) *
        100
    );
  }

  return {
    current: current.revenue,
    previous: previous.revenue,
    growth,
    previousFrom:
      previousFrom.toISOString(),
    previousTo:
      previousTo.toISOString(),
  };
}

export async function GET(request) {
  try {
    // ---------------------------------------
    // AUTH
    // ---------------------------------------

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

    if (session.user.role !== "admin") {
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

    // ---------------------------------------
    // QUERY
    // ---------------------------------------

    const { searchParams } =
      new URL(request.url);

    const range =
      searchParams.get("range") || "month";

    const fromParam =
      searchParams.get("from");

    const toParam =
      searchParams.get("to");

    const yearParam =
      Number(searchParams.get("year"));

    const limitParam =
      Number(searchParams.get("limit") || 30);

    const limit = Math.min(
      Math.max(
        Number.isFinite(limitParam)
          ? limitParam
          : 30,
        1
      ),
      100
    );

    const now = new Date();

    const selectedRange = getSelectedRange(
      range,
      now,
      fromParam,
      toParam
    );

    if (!selectedRange) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid date range.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      selectedRange.from &&
      selectedRange.to &&
      selectedRange.from >
        selectedRange.to
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Start date cannot be after end date.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------
    // COMMON PERIODS
    // ---------------------------------------

    const [
      selected,
      today,
      week,
      month,
      year,
      allTime,
      byType,
      byMethod,
      paymentStats,
      recentTransactions,
    ] = await Promise.all([
      getRevenue(
        selectedRange.from,
        selectedRange.to
      ),

      getRevenue(
        startOfDay(now),
        endOfDay(now)
      ),

      getRevenue(
        startOfWeek(now),
        endOfDay(now)
      ),

      getRevenue(
        startOfMonth(now),
        endOfMonth(now)
      ),

      getRevenue(
        startOfYear(now),
        endOfYear(now)
      ),

      getRevenue(),

      getRevenueByType(
        selectedRange.from,
        selectedRange.to
      ),

      getRevenueByMethod(
        selectedRange.from,
        selectedRange.to
      ),

      getPaymentStats(),

      getRecentTransactions(limit),
    ]);

    // ---------------------------------------
    // TRENDS
    // ---------------------------------------

    const trendYear =
      Number.isInteger(yearParam) &&
      yearParam >= 2000 &&
      yearParam <= 2100
        ? yearParam
        : now.getFullYear();

    const monthly = await getMonthlyRevenue(
      trendYear
    );

    const daily = await getDailyRevenue(
      selectedRange.from,
      selectedRange.to
    );

    // ---------------------------------------
    // COMPARISON
    // ---------------------------------------

    const comparison =
      await getComparison(
        selectedRange.from,
        selectedRange.to
      );

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return NextResponse.json({
      success: true,

      range: {
        type: range,

        from: selectedRange.from
          ? selectedRange.from.toISOString()
          : null,

        to: selectedRange.to
          ? selectedRange.to.toISOString()
          : null,
      },

      overview: {
        selected: selected.revenue,

        today: today.revenue,

        week: week.revenue,

        month: month.revenue,

        year: year.revenue,

        allTime: allTime.revenue,

        transactions:
          selected.transactions,

        averageTransaction:
          selected.transactions > 0
            ? money(
                selected.revenue /
                  selected.transactions
              )
            : 0,
      },

      breakdown: {
        byType,

        byMethod,

        membership:
          byType.membership?.revenue || 0,

        renewal:
          byType.renewal?.revenue || 0,

        registration:
          byType.registration?.revenue || 0,

        promotion:
          byType.promotion?.revenue || 0,

        product:
          byType.product?.revenue || 0,

        other:
          byType.other?.revenue || 0,
      },

      trend: {
        year: trendYear,

        monthly,

        daily,
      },

      comparison,

      paymentStats,

      recentTransactions,
    });
  } catch (error) {
    console.error(
      "=== ADMIN REVENUE API ERROR ===",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load revenue analytics.",
      },
      {
        status: 500,
      }
    );
  }
}