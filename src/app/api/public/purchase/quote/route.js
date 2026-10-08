import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import MembershipPlan from "@/models/MembershipPlan";
import AddOn from "@/models/AddOn";
import Promotion from "@/models/Promotion";
import User from "@/models/User";

const REGISTRATION_FEE = 500;

/* =========================================================
   HELPERS
========================================================= */

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function isValidObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ""));
}

function calculateDiscount(normalPrice, offerPrice) {
  return Math.max(
    0,
    Number(normalPrice) - Number(offerPrice)
  );
}

/* =========================================================
   POST
========================================================= */

export async function POST(request) {
  try {
    /* =====================================================
       1. READ BODY
    ===================================================== */

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const {
      planId,
      gender,
      membershipType = "individual",
      addOnIds = [],
      promotionId = null,
      email,
      phone,
    } = body || {};

    /* =====================================================
       2. BASIC VALIDATION
    ===================================================== */

    if (!isValidObjectId(planId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid membership plan.",
        },
        { status: 400 }
      );
    }

    if (!["male", "female"].includes(gender)) {
      return NextResponse.json(
        {
          success: false,
          message: "Gender must be male or female.",
        },
        { status: 400 }
      );
    }

    if (
      !["individual", "couple"].includes(
        membershipType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid membership type.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(addOnIds)) {
      return NextResponse.json(
        {
          success: false,
          message: "Add-ons must be provided as an array.",
        },
        { status: 400 }
      );
    }

    if (addOnIds.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many add-ons selected.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       3. DUPLICATE ADD-ON CHECK
    ===================================================== */

    const uniqueAddOnIds = [
      ...new Set(
        addOnIds.map((id) => String(id))
      ),
    ];

    if (
      uniqueAddOnIds.length !==
      addOnIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate add-ons are not allowed.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       4. ADD-ON OBJECT ID VALIDATION
    ===================================================== */

    if (
      uniqueAddOnIds.some(
        (id) => !isValidObjectId(id)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more add-on IDs are invalid.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       5. PROMOTION OBJECT ID VALIDATION
    ===================================================== */

    if (
      promotionId !== null &&
      promotionId !== "" &&
      !isValidObjectId(promotionId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promotion.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       6. DATABASE
    ===================================================== */

    await connectDB();

    /* =====================================================
       7. GET ACTIVE PLAN
    ===================================================== */

    const plan =
      await MembershipPlan.findOne({
        _id: planId,
        isActive: true,
      }).lean();

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Membership plan is not available.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       8. PLAN ELIGIBILITY
    ===================================================== */

    const planEligibility =
      plan.eligibility || "both";

    if (
      planEligibility !== "both" &&
      planEligibility !== gender
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This membership plan is not available for the selected gender.",
        },
        { status: 400 }
      );
    }

    /*
     * Couple memberships require a plan that
     * supports both genders.
     */

    if (
      membershipType === "couple" &&
      planEligibility !== "both"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This membership plan cannot be used for a couple membership.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       9. GET ACTIVE ADD-ONS
    ===================================================== */

    let addOns = [];

    if (uniqueAddOnIds.length > 0) {
      addOns = await AddOn.find({
        _id: {
          $in: uniqueAddOnIds,
        },
        isActive: true,
      })
        .select(
          "_id name description type price"
        )
        .lean();

      /*
       * Every requested add-on must still exist
       * and be active.
       */

      if (
        addOns.length !==
        uniqueAddOnIds.length
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more selected add-ons are unavailable.",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       10. ADD-ON PRICE BREAKDOWN
    ===================================================== */

    const addOnsBreakdown = addOns.map(
      (addOn) => ({
        id: addOn._id,
        name: addOn.name,
        type: addOn.type,
        price: Number(addOn.price),
      })
    );

    const addOnsTotal = addOns.reduce(
      (total, addOn) =>
        total + Number(addOn.price),
      0
    );

    /* =====================================================
       11. NEW PURCHASE ACCOUNT CHECK
    ===================================================== */

    /*
     * Public purchase is for NEW memberships.
     *
     * Existing members should use the member
     * renewal/extension flow instead.
     */

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedPhone =
      normalizeString(phone);

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    if (
      normalizedPhone &&
      !/^[0-9]{10}$/.test(
        normalizedPhone
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid 10-digit phone number.",
        },
        { status: 400 }
      );
    }

    let existingUser = null;

    if (
      normalizedEmail ||
      normalizedPhone
    ) {
      const userConditions = [];

      if (normalizedEmail) {
        userConditions.push({
          email: normalizedEmail,
        });
      }

      if (normalizedPhone) {
        userConditions.push({
          phone: normalizedPhone,
        });
      }

      if (userConditions.length > 0) {
        existingUser =
          await User.findOne({
            $or: userConditions,
          })
            .select(
              "_id email phone"
            )
            .lean();
      }
    }

    /*
     * The quote endpoint must follow the same
     * business rule as the purchase endpoint.
     */

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account already exists with this email address or phone number. Please log in to continue.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       12. REGISTRATION FEE
    ===================================================== */

    let registrationFee =
      REGISTRATION_FEE;

    let promotion = null;

    let membershipPrice =
      Number(plan.price);

    let promotionDiscount = 0;

    let registrationFeeWaived = false;

    /* =====================================================
       13. PROMOTION
    ===================================================== */

    if (promotionId) {
      promotion =
        await Promotion.findOne({
          _id: promotionId,
          type: "membership",
          isActive: true,
        })
          .populate({
            path: "membershipPlan",
            select: "_id name price",
          })
          .lean();

      if (!promotion) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The selected promotion is not available.",
          },
          { status: 400 }
        );
      }

      /* ===================================================
         PROMOTION DATE VALIDATION
      =================================================== */

      const now = new Date();

      const startDate = new Date(
        promotion.startDate
      );

      const endDate = new Date(
        promotion.endDate
      );

      if (
        Number.isNaN(
          startDate.getTime()
        ) ||
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The selected promotion has invalid dates.",
          },
          { status: 400 }
        );
      }

      if (
        now < startDate ||
        now > endDate
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The selected promotion has expired or is not active yet.",
          },
          { status: 400 }
        );
      }

      /* ===================================================
         PROMOTION PLAN VALIDATION
      =================================================== */

      if (
        !promotion.membershipPlan ||
        String(
          promotion.membershipPlan._id
        ) !==
          String(plan._id)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This promotion does not apply to the selected membership plan.",
          },
          { status: 400 }
        );
      }

      /* ===================================================
         PROMOTIONAL PRICE
      =================================================== */

      const offerPrice =
        Number(
          promotion.offerPrice
        );

      const normalPrice =
        Number(plan.price);

      if (
        !Number.isFinite(offerPrice) ||
        offerPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The promotion has an invalid price.",
          },
          { status: 400 }
        );
      }

      /*
       * A promotion must never make the
       * membership more expensive.
       */

      if (
        offerPrice > normalPrice
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The promotion price cannot exceed the normal membership price.",
          },
          { status: 400 }
        );
      }

      membershipPrice =
        offerPrice;

      promotionDiscount =
        calculateDiscount(
          normalPrice,
          offerPrice
        );

      /* ===================================================
         REGISTRATION FEE WAIVER
      =================================================== */

      if (
        promotion.registrationFeeWaived ===
        true
      ) {
        registrationFeeWaived =
          true;
      }
    }

    /* =====================================================
       14. APPLY REGISTRATION FEE WAIVER
    ===================================================== */

    if (registrationFeeWaived) {
      registrationFee = 0;
    }

    /* =====================================================
       15. FINAL TOTAL
    ===================================================== */

    const totalAmount =
      membershipPrice +
      addOnsTotal +
      registrationFee;

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to calculate purchase amount.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       16. RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        quote: {
          plan: {
            id: plan._id,
            name: plan.name,
            description:
              plan.description || "",
            durationInDays:
              plan.durationInDays,
            eligibility:
              planEligibility,
            regularPrice:
              Number(plan.price),
            price: membershipPrice,
          },

          membershipType,

          addOns: addOnsBreakdown,

          pricing: {
            membershipPrice,

            regularMembershipPrice:
              Number(plan.price),

            promotionDiscount,

            addOnsTotal,

            registrationFee,

            totalAmount,
          },

          promotion: promotion
            ? {
                id: promotion._id,
                title:
                  promotion.title,
                description:
                  promotion.description ||
                  "",
                offerPrice:
                  Number(
                    promotion.offerPrice
                  ),
                registrationFeeWaived,
                startDate:
                  promotion.startDate,
                endDate:
                  promotion.endDate,
              }
            : null,

          currency: "INR",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUBLIC PURCHASE QUOTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to calculate purchase quote.",
      },
      { status: 500 }
    );
  }
}