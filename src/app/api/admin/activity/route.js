import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import AdminActivity from "@/models/AdminActivity";

// ==========================================
// GET ADMIN ACTIVITY
// ==========================================

export async function GET(request) {
  try {
    // ========================================
    // 1. AUTHENTICATION
    // ========================================

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

    // ========================================
    // 2. ADMIN AUTHORIZATION
    // ========================================

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

    // ========================================
    // 3. CONNECT DATABASE
    // ========================================

    await connectDB();

    // ========================================
    // 4. READ QUERY PARAMETERS
    // ========================================

    const { searchParams } = new URL(
      request.url
    );

    // Page
    const pageParam = Number(
      searchParams.get("page") || 1
    );

    // Limit
    const limitParam = Number(
      searchParams.get("limit") || 20
    );

    // Search text
    const search =
      searchParams.get("search")?.trim() || "";

    // Specific admin
    const adminId =
      searchParams.get("admin")?.trim() || "";

    // ========================================
    // 5. SAFE PAGINATION
    // ========================================

    const page =
      Number.isInteger(pageParam) &&
      pageParam >= 1
        ? pageParam
        : 1;

    // Don't allow huge requests
    const limit =
      Number.isInteger(limitParam) &&
      limitParam >= 1 &&
      limitParam <= 100
        ? limitParam
        : 20;

    const skip = (page - 1) * limit;

    // ========================================
    // 6. BUILD QUERY
    // ========================================

    const query = {};

    // ========================================
    // FILTER BY ADMIN
    // ========================================

    if (adminId) {
      query.admin = adminId;
    }

    // ========================================
    // SEARCH
    // ========================================
    //
    // Search action, description or entity type.
    //
    // Example:
    //
    // "payment"
    // "membership"
    // "admin"
    // ========================================

    if (search) {
      const escapedSearch =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const searchRegex = new RegExp(
        escapedSearch,
        "i"
      );

      query.$or = [
        {
          action: searchRegex,
        },
        {
          description: searchRegex,
        },
        {
          entityType: searchRegex,
        },
      ];
    }

    // ========================================
    // 7. GET TOTAL COUNT
    // ========================================

    const totalActivities =
      await AdminActivity.countDocuments(
        query
      );

    // ========================================
    // 8. GET ACTIVITIES
    // ========================================

    const activities =
      await AdminActivity.find(query)
        .populate({
          path: "admin",
          select: "name email role",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    // ========================================
    // 9. CALCULATE TOTAL PAGES
    // ========================================

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalActivities / limit
        )
      );

    // ========================================
    // 10. RETURN RESPONSE
    // ========================================

    return NextResponse.json(
      {
        success: true,

        activities,

        pagination: {
          page,
          limit,
          totalActivities,
          totalPages,
          hasNextPage:
            page < totalPages,
          hasPreviousPage:
            page > 1,
        },

        // These make it easier for the
        // frontend to use the response.
        totalPages,
        currentPage: page,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET ADMIN ACTIVITY ERROR:",
      error
    );

    // ========================================
    // SAFE ERROR
    // ========================================
    //
    // Don't expose MongoDB/internal errors
    // to the browser.
    // ========================================

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load admin activity.",
      },
      {
        status: 500,
      }
    );
  }
}