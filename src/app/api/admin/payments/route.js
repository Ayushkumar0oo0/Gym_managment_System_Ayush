import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Payment from "@/models/Payment";
import MembershipPlan from "@/models/MembershipPlan";
import Promotion from "@/models/Promotion";
import ProductOrder from "@/models/ProductOrder";
import {
  adminRateLimit,
  createRateLimitIdentifier,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function GET(request) {
  try {
    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================

    const authSession = await auth();

    if (!authSession?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. ADMIN AUTHORIZATION
    // ==========================================

    if (authSession.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admin permission required.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 3. RATE LIMIT
    // ==========================================

    const clientIp = getClientIp(request);

    const rateLimitIdentifier = createRateLimitIdentifier(
      `admin-payments:${authSession.user.id}`,
      clientIp
    );

    const rateLimitResult = await adminRateLimit.limit(
      rateLimitIdentifier
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // ==========================================
    // 4. DATABASE
    // ==========================================

    await connectDB();

    // ==========================================
    // 5. QUERY PARAMETERS
    // ==========================================

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const method = searchParams.get("method")?.trim() || "";
    const paymentType =
      searchParams.get("paymentType")?.trim() || "";

    const pageParam = Number(searchParams.get("page") || 1);
    const limitParam = Number(searchParams.get("limit") || 50);

    const page =
      Number.isInteger(pageParam) && pageParam > 0
        ? Math.min(pageParam, 10000)
        : 1;

    const limit =
      Number.isInteger(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 50;

    const skip = (page - 1) * limit;

    // ==========================================
    // 6. VALIDATE FILTERS
    // ==========================================

    const allowedStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    const allowedMethods = ["online", "upi", "cash"];

    const allowedPaymentTypes = [
      "registration",
      "membership",
      "renewal",
      "promotion",
      "product",
      "other",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status.",
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

    if (
      paymentType &&
      !allowedPaymentTypes.includes(paymentType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment type.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 7. SAFE SEARCH
    // ==========================================

    const safeSearch = search
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // ==========================================
    // 8. BUILD QUERY
    // ==========================================

    const query = {};

    if (status) {
      query.status = status;
    }

    if (method) {
      query.method = method;
    }

    if (paymentType) {
      query.paymentType = paymentType;
    }

    // ==========================================
    // 9. SEARCH
    // ==========================================

    if (safeSearch) {
      const [
        matchingUsers,
        matchingPromotions,
        matchingPlans,
      ] = await Promise.all([
        User.find({
          $or: [
            {
              name: {
                $regex: safeSearch,
                $options: "i",
              },
            },
            {
              email: {
                $regex: safeSearch,
                $options: "i",
              },
            },
            {
              phone: {
                $regex: safeSearch,
                $options: "i",
              },
            },
          ],
        })
          .select("_id")
          .limit(100)
          .lean(),

        Promotion.find({
          title: {
            $regex: safeSearch,
            $options: "i",
          },
        })
          .select("_id")
          .limit(100)
          .lean(),

        MembershipPlan.find({
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        })
          .select("_id")
          .limit(100)
          .lean(),
      ]);

      const matchingUserIds = matchingUsers.map(
        (user) => user._id
      );

      const matchingPromotionIds = matchingPromotions.map(
        (promotion) => promotion._id
      );

      const matchingPlanIds = matchingPlans.map(
        (plan) => plan._id
      );

      query.$or = [
        {
          user: {
            $in: matchingUserIds,
          },
        },
        {
          promotion: {
            $in: matchingPromotionIds,
          },
        },
        {
          membershipPlan: {
            $in: matchingPlanIds,
          },
        },
        {
          transactionId: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          gatewayPaymentId: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          gatewayOrderId: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          notes: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    // ==========================================
    // 10. FETCH PAYMENTS
    // ==========================================

    const [payments, totalPayments] = await Promise.all([
      Payment.find(query)
        .populate(
          "user",
          "name email phone gender"
        )
        .populate(
          "membership",
          "startDate endDate status membershipType coupleStatus priceAtPurchase"
        )
        .populate(
          "membershipPlan",
          "name description price durationInDays features eligibility"
        )
        .populate(
          "promotion",
          "type title description offerPrice extensionDays registrationFeeWaived startDate endDate isActive"
        )
        .populate(
          "recordedBy",
          "name email role"
        )
        .populate(
          "receivedBy",
          "name email role"
        )
        .populate(
          "productOrder",
          "orderNumber status totalAmount"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Payment.countDocuments(query),
    ]);

    // ==========================================
    // 11. FORMAT PAYMENTS
    // ==========================================

    const formattedPayments = payments.map((payment) => ({
      id: payment._id.toString(),

      user: payment.user
        ? {
            id: payment.user._id.toString(),
            name: payment.user.name || "",
            email: payment.user.email || "",
            phone: payment.user.phone || "",
            gender: payment.user.gender || null,
          }
        : null,

      membership: payment.membership
        ? {
            id: payment.membership._id.toString(),
            startDate: payment.membership.startDate,
            endDate: payment.membership.endDate,
            status: payment.membership.status,
            membershipType:
              payment.membership.membershipType ||
              "individual",
            coupleStatus:
              payment.membership.coupleStatus || null,
            priceAtPurchase:
              payment.membership.priceAtPurchase ?? null,
          }
        : null,

      membershipPlan: payment.membershipPlan
        ? {
            id: payment.membershipPlan._id.toString(),
            name: payment.membershipPlan.name,
            description:
              payment.membershipPlan.description || "",
            price: payment.membershipPlan.price,
            durationInDays:
              payment.membershipPlan.durationInDays,
            features:
              payment.membershipPlan.features || [],
            eligibility:
              payment.membershipPlan.eligibility ||
              "both",
          }
        : null,

      promotion: payment.promotion
        ? {
            id: payment.promotion._id.toString(),
            type: payment.promotion.type,
            title: payment.promotion.title,
            description:
              payment.promotion.description || "",
            offerPrice: payment.promotion.offerPrice,
            extensionDays:
              payment.promotion.extensionDays ?? null,
            registrationFeeWaived:
              payment.promotion.registrationFeeWaived ||
              false,
            startDate: payment.promotion.startDate,
            endDate: payment.promotion.endDate,
            isActive: payment.promotion.isActive,
          }
        : null,

      productOrder: payment.productOrder
        ? {
            id: payment.productOrder._id.toString(),
            orderNumber:
              payment.productOrder.orderNumber || "",
            status:
              payment.productOrder.status || "",
            totalAmount:
              payment.productOrder.totalAmount ?? null,
          }
        : null,

      paymentType: payment.paymentType,
      amount: Number(payment.amount || 0),
      method: payment.method,
      status: payment.status,

      membershipStartDate:
        payment.membershipStartDate || null,

      gatewayOrderId:
        payment.gatewayOrderId || null,

      gatewayPaymentId:
        payment.gatewayPaymentId || null,

      transactionId:
        payment.transactionId || null,

      paidAt: payment.paidAt || null,

      notes: payment.notes || "",

      recordedBy: payment.recordedBy
        ? {
            id: payment.recordedBy._id.toString(),
            name: payment.recordedBy.name || "",
            email: payment.recordedBy.email || "",
            role: payment.recordedBy.role || "admin",
          }
        : null,

      receivedBy: payment.receivedBy
        ? {
            id: payment.receivedBy._id.toString(),
            name: payment.receivedBy.name || "",
            email: payment.receivedBy.email || "",
            role: payment.receivedBy.role || "admin",
          }
        : null,

      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    // ==========================================
    // 12. STATISTICS
    // ==========================================

    const revenueMatch = {
      status: "paid",
    };

    const pendingMatch = {
      status: "pending",
    };

    const [
      revenueResult,
      pendingResult,
      pendingCashResult,
      pendingUpiResult,
      membershipRevenueResult,
      renewalRevenueResult,
      promotionRevenueResult,
      registrationRevenueResult,
      productRevenueResult,
      otherRevenueResult,
      cashRevenueResult,
      upiRevenueResult,
    ] = await Promise.all([
      Payment.aggregate([
        {
          $match: revenueMatch,
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: pendingMatch,
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "pending",
            method: "cash",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
  $match: {
    status: "paid",
    method: "online",
  },
},
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            paymentType: "membership",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            paymentType: "renewal",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            paymentType: "promotion",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            paymentType: "registration",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            paymentType: "product",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            paymentType: "other",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            method: "cash",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "paid",
            method: { $in: ["online", "upi"] },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const getTotal = (result) =>
      Number(result?.[0]?.total || 0);

    const getCount = (result) =>
      Number(result?.[0]?.count || 0);

    // ==========================================
    // 13. REVENUE BY ADMIN
    // ==========================================

    const revenueByAdmin = await Payment.aggregate([
      {
        $match: {
          status: "paid",
        },
      },
      {
        $match: {
          $or: [
            {
              receivedBy: {
                $ne: null,
              },
            },
            {
              recordedBy: {
                $ne: null,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: {
            $ifNull: ["$receivedBy", "$recordedBy"],
          },
          totalRevenue: {
            $sum: "$amount",
          },
          paymentCount: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          totalRevenue: -1,
        },
      },
    ]);

    // ==========================================
    // 14. ADMIN DETAILS
    // ==========================================

    const adminIds = revenueByAdmin
      .map((item) => item._id)
      .filter(Boolean);

    const admins =
      adminIds.length > 0
        ? await User.find({
            _id: {
              $in: adminIds,
            },
          })
            .select("_id name email")
            .lean()
        : [];

    const adminMap = new Map(
      admins.map((admin) => [
        admin._id.toString(),
        admin,
      ])
    );

    const formattedRevenueByAdmin =
      revenueByAdmin.map((item) => {
        const admin = item._id
          ? adminMap.get(item._id.toString())
          : null;

        return {
          admin: admin
            ? {
                id: admin._id.toString(),
                name: admin.name || "",
                email: admin.email || "",
              }
            : null,

          totalRevenue: Number(
            item.totalRevenue || 0
          ),

          paymentCount: Number(
            item.paymentCount || 0
          ),
        };
      });

    // ==========================================
    // 15. PAGINATION
    // ==========================================

    const totalPages =
      totalPayments > 0
        ? Math.ceil(totalPayments / limit)
        : 1;

    // ==========================================
    // 16. RESPONSE
    // ==========================================

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
          totalRevenue:
            getTotal(revenueResult),

          pendingAmount:
            getTotal(pendingResult),

          pendingCount:
            getCount(pendingResult),

          pendingCashAmount:
            getTotal(pendingCashResult),

          pendingCashCount:
            getCount(pendingCashResult),

          pendingUpiAmount:
            getTotal(pendingUpiResult),

          pendingUpiCount:
            getCount(pendingUpiResult),

          membershipRevenue:
            getTotal(membershipRevenueResult),

          membershipPaymentCount:
            getCount(membershipRevenueResult),

          renewalRevenue:
            getTotal(renewalRevenueResult),

          renewalPaymentCount:
            getCount(renewalRevenueResult),

          promotionRevenue:
            getTotal(promotionRevenueResult),

          promotionPaymentCount:
            getCount(promotionRevenueResult),

          registrationRevenue:
            getTotal(registrationRevenueResult),

          registrationPaymentCount:
            getCount(registrationRevenueResult),

          productRevenue:
            getTotal(productRevenueResult),

          productPaymentCount:
            getCount(productRevenueResult),

          otherRevenue:
            getTotal(otherRevenueResult),

          otherPaymentCount:
            getCount(otherRevenueResult),

          cashRevenue:
            getTotal(cashRevenueResult),

          cashPaymentCount:
            getCount(cashRevenueResult),

          upiRevenue:
            getTotal(upiRevenueResult),

          upiPaymentCount:
            getCount(upiRevenueResult),
        },

        revenueByAdmin:
          formattedRevenueByAdmin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN PAYMENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to fetch payments.",
      },
      { status: 500 }
    );
  }
}