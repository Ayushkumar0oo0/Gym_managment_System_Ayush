import User from "@/models/User";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import Payment from "@/models/Payment";

export async function GET(request) {
  try {
    // 1. AUTHENTICATION
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

    // 2. MEMBER ACCESS ONLY
    if (session.user.role !== "member") {
      return NextResponse.json(
        {
          success: false,
          message: "Only members can view payment history.",
        },
        { status: 403 }
      );
    }


// 3. DATABASE
await connectDB();

const member = await User.findById(session.user.id)
  .select("_id role isActive")
  .lean();

if (!member || member.role !== "member" || !member.isActive) {
  return NextResponse.json(
    {
      success: false,
      message: "Your account is inactive or unavailable.",
      code: "ACCOUNT_INACTIVE",
    },
    { status: 403 }
  );
}

const memberId = member._id;


    // 5. VALIDATE FILTERS
    const allowedPaymentTypes = [
      "registration",
      "membership",
      "renewal",
      "promotion",
      "product",
      "other",
    ];

    const allowedMethods = ["online", "upi", "cash"];

    const allowedStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (paymentType && !allowedPaymentTypes.includes(paymentType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment type.",
        },
        { status: 400 }
      );
    }

    if (method && !allowedMethods.includes(method)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method.",
        },
        { status: 400 }
      );
    }

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status.",
        },
        { status: 400 }
      );
    }

    // 6. BUILD QUERY
    const query = {
       user: memberId,
    };

    if (paymentType) {
      query.paymentType = paymentType;
    }

    if (method) {
      query.method = method;
    }

    if (status) {
      query.status = status;
    }

    // 7. PAGINATION
    const skip = (page - 1) * limit;

    // 8. FETCH PAYMENTS
    const [payments, totalPayments] = await Promise.all([
      Payment.find(query)
        .populate(
          "membershipPlan",
          "name description price durationInDays features"
        )
        .populate(
          "promotion",
          "type title description offerPrice extensionDays"
        )
        .populate(
          "membership",
          "membershipType startDate endDate status"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Payment.countDocuments(query),
    ]);

    // 9. FORMAT PAYMENTS
    const formattedPayments = payments.map((payment) => ({
      id: payment._id.toString(),
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      paymentType: payment.paymentType,

      transactionId: payment.transactionId || null,
      gatewayOrderId: payment.gatewayOrderId || null,
      gatewayPaymentId: payment.gatewayPaymentId || null,

      membershipStartDate: payment.membershipStartDate || null,
      paidAt: payment.paidAt || null,
      createdAt: payment.createdAt || null,
      notes: payment.notes || "",

      membershipPlan: payment.membershipPlan
        ? {
            id: payment.membershipPlan._id.toString(),
            name: payment.membershipPlan.name,
            description: payment.membershipPlan.description || "",
            price: payment.membershipPlan.price,
            durationInDays: payment.membershipPlan.durationInDays,
            features: payment.membershipPlan.features || [],
          }
        : null,

      promotion: payment.promotion
        ? {
            id: payment.promotion._id.toString(),
            type: payment.promotion.type,
            title: payment.promotion.title,
            description: payment.promotion.description || "",
            offerPrice: payment.promotion.offerPrice,
            extensionDays: payment.promotion.extensionDays ?? null,
          }
        : null,

      membership: payment.membership
        ? {
            id: payment.membership._id.toString(),
            membershipType: payment.membership.membershipType,
            startDate: payment.membership.startDate,
            endDate: payment.membership.endDate,
            status: payment.membership.status,
          }
        : null,
    }));

    // 10. MEMBER PAYMENT STATISTICS
    const [
      totalPaidResult,
      totalPendingResult,
      totalRefundedResult,
      membershipRevenueResult,
      renewalRevenueResult,
      promotionRevenueResult,
      registrationRevenueResult,
      cashRevenueResult,
      upiRevenueResult,
      onlineRevenueResult,
    ] = await Promise.all([
      // All paid payments, regardless of method
      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "paid",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "pending",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "refunded",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "paid",
            paymentType: "membership",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "paid",
            paymentType: "renewal",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "paid",
            paymentType: "promotion",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "paid",
            paymentType: "registration",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "paid",
            method: "cash",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      // Legacy UPI payments
      Payment.aggregate([
        {
          $match: {
            user: memberId,
            status: "paid",
            method: "upi",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),

      // New online payments
      Payment.aggregate([
        {
          $match: {
           user: memberId,
            status: "paid",
            method: "online",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const totalPages = Math.ceil(totalPayments / limit);

    // 11. RESPONSE
    return NextResponse.json(
      {
        success: true,

        payments: formattedPayments,

        pagination: {
          page,
          limit,
          totalPayments,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },

        stats: {
          totalPaid: totalPaidResult[0]?.amount || 0,
          totalPending: totalPendingResult[0]?.amount || 0,
          totalRefunded: totalRefundedResult[0]?.amount || 0,

          membershipRevenue:
            membershipRevenueResult[0]?.amount || 0,

          renewalRevenue:
            renewalRevenueResult[0]?.amount || 0,

          promotionRevenue:
            promotionRevenueResult[0]?.amount || 0,

          registrationRevenue:
            registrationRevenueResult[0]?.amount || 0,

          cashRevenue: cashRevenueResult[0]?.amount || 0,
          upiRevenue: upiRevenueResult[0]?.amount || 0,
          onlineRevenue: onlineRevenueResult[0]?.amount || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("MEMBER PAYMENTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load payment history.",
      },
      { status: 500 }
    );
  }
}
