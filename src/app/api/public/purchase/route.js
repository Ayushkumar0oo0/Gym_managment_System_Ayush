import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

import PurchaseOrder from "@/models/PurchaseOrder";
import MembershipPlan from "@/models/MembershipPlan";
import AddOn from "@/models/AddOn";
import Promotion from "@/models/Promotion";
import User from "@/models/User";

import {
  paymentRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";

const REGISTRATION_FEE = 500;
const PURCHASE_EXPIRY_MINUTES = 15;

/* =========================================================
   HELPERS
========================================================= */

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function generateOrderNumber() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `GYM-${timestamp}-${random}`;
}

function addMinutes(date, minutes) {
  return new Date(
    new Date(date).getTime() +
      minutes * 60 * 1000
  );
}

function isValidObjectId(value) {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
}

/* =========================================================
   POST
========================================================= */

export async function POST(request) {
  try {
    /* =====================================================
       1. RATE LIMIT
    ===================================================== */

    const clientIp = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        `purchase:${clientIp}`
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(
        rateLimitResult
      );
    }

    /* =====================================================
       2. READ REQUEST BODY
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
      name,
      email,
      phone,
      password,
      gender,

      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,

      membershipType = "individual",
      partner,

      membershipPlanId,

      selectedAddOns = [],

      promotionId = null,

      paymentMethod,
    } = body || {};

    /* =====================================================
       3. BASIC VALIDATION
    ===================================================== */

    const cleanName = String(name || "").trim();

    const cleanEmail = normalizeEmail(email);

    const cleanPhone = normalizePhone(phone);

    const cleanPassword = String(password || "");

    if (
      cleanName.length < 2 ||
      cleanName.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid name.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[0-9]{10}$/.test(cleanPhone)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number must contain exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (
      !["male", "female"].includes(gender)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid gender.",
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

    if (
      !["upi", "cash"].includes(paymentMethod)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid payment method.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidObjectId(
        String(membershipPlanId || "")
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid membership plan.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       4. EMERGENCY CONTACT
    ===================================================== */

    const cleanEmergencyPhone =
      normalizePhone(
        emergencyContactPhone
      );

    const cleanEmergencyName =
      String(
        emergencyContactName || ""
      ).trim();

    const cleanEmergencyRelation =
      String(
        emergencyContactRelation || ""
      ).trim();

    if (
      cleanEmergencyPhone &&
      !/^[0-9]{10}$/.test(
        cleanEmergencyPhone
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Emergency contact phone must contain exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    if (
      cleanEmergencyPhone &&
      cleanEmergencyPhone === cleanPhone
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Emergency contact phone cannot be the same as your phone number.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       5. COUPLE PARTNER VALIDATION
    ===================================================== */

    let cleanPartner = null;

    if (membershipType === "couple") {
      if (!partner) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Partner information is required for a couple membership.",
          },
          { status: 400 }
        );
      }

      const partnerName =
        String(partner.name || "").trim();

      const partnerEmail =
        normalizeEmail(partner.email);

      const partnerPhone =
        normalizePhone(partner.phone);

      const partnerGender =
        partner.gender;

      if (
        partnerName.length < 2 ||
        partnerName.length > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter a valid partner name.",
          },
          { status: 400 }
        );
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          partnerEmail
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter a valid partner email.",
          },
          { status: 400 }
        );
      }

      if (
        !/^[0-9]{10}$/.test(
          partnerPhone
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Partner phone number must contain exactly 10 digits.",
          },
          { status: 400 }
        );
      }

      if (
        !["male", "female"].includes(
          partnerGender
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a valid partner gender.",
          },
          { status: 400 }
        );
      }

      if (partnerGender === gender) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Couple members must have different genders.",
          },
          { status: 400 }
        );
      }

      if (partnerEmail === cleanEmail) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Primary member and partner must use different email addresses.",
          },
          { status: 400 }
        );
      }

      if (partnerPhone === cleanPhone) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Primary member and partner must use different phone numbers.",
          },
          { status: 400 }
        );
      }

      cleanPartner = {
        name: partnerName,
        email: partnerEmail,
        phone: partnerPhone,
        gender: partnerGender,
      };
    }

    /* =====================================================
       6. DATABASE
    ===================================================== */

    await connectDB();

    /* =====================================================
       7. EXISTING PRIMARY ACCOUNT
    ===================================================== */

    const existingUser =
      await User.findOne({
        $or: [
          { email: cleanEmail },
          { phone: cleanPhone },
        ],
      }).select("_id");

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account already exists with this email address or phone number. Please log in instead.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       8. EXISTING PARTNER ACCOUNT
    ===================================================== */

    if (cleanPartner) {
      const existingPartner =
        await User.findOne({
          $or: [
            {
              email: cleanPartner.email,
            },
            {
              phone: cleanPartner.phone,
            },
          ],
        }).select("_id");

      if (existingPartner) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An account already exists with the partner's email address or phone number.",
            code: "PARTNER_ACCOUNT_EXISTS",
          },
          { status: 409 }
        );
      }
    }

    /* =====================================================
       9. LOAD MEMBERSHIP PLAN
    ===================================================== */

    const membershipPlan =
      await MembershipPlan.findOne({
        _id: membershipPlanId,
        isActive: true,
      }).lean();

    if (!membershipPlan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected membership plan is not available.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       10. VALIDATE PLAN DURATION
    ===================================================== */

    const durationInDays = Number(
      membershipPlan.durationInDays
    );

    if (
      !Number.isInteger(durationInDays) ||
      durationInDays < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected membership plan has an invalid duration.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       11. PLAN ELIGIBILITY
    ===================================================== */

    if (
      membershipPlan.eligibility !== "both" &&
      membershipPlan.eligibility !== gender
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

    if (
      membershipType === "couple" &&
      membershipPlan.eligibility !== "both"
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
       12. VALIDATE ADD-ONS
    ===================================================== */

    if (!Array.isArray(selectedAddOns)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid add-ons.",
        },
        { status: 400 }
      );
    }

    const uniqueAddOnIds = [
      ...new Set(
        selectedAddOns.map((id) =>
          String(id)
        )
      ),
    ];

    if (uniqueAddOnIds.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many add-ons selected.",
        },
        { status: 400 }
      );
    }

    for (const addOnId of uniqueAddOnIds) {
      if (!isValidObjectId(addOnId)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more selected add-ons are invalid.",
          },
          { status: 400 }
        );
      }
    }

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

      if (
        addOns.length !==
        uniqueAddOnIds.length
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more selected add-ons are no longer available.",
          },
          { status: 400 }
        );
      }
    }

    const selectedAddOnSnapshots =
      addOns.map((addOn) => ({
        addOn: addOn._id,
        name: addOn.name,
        priceAtPurchase:
          Number(addOn.price) || 0,
      }));

    const addOnsTotal =
      selectedAddOnSnapshots.reduce(
        (total, addOn) =>
          total +
          Number(
            addOn.priceAtPurchase
          ),
        0
      );

    /* =====================================================
       13. BASE PRICE
    ===================================================== */

    let membershipPrice =
      Number(membershipPlan.price);

    if (
      !Number.isFinite(membershipPrice) ||
      membershipPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid membership plan price.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       14. REGISTRATION FEE
    ===================================================== */

    let registrationFee =
      REGISTRATION_FEE;

    let promotion = null;

    let discount = 0;

    /* =====================================================
       15. PROMOTION VALIDATION
    ===================================================== */

    if (
      promotionId !== null &&
      promotionId !== ""
    ) {
      if (
        !isValidObjectId(
          String(promotionId)
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid promotion.",
          },
          { status: 400 }
        );
      }

      const now = new Date();

      promotion =
        await Promotion.findOne({
          _id: promotionId,
          type: "membership",
          isActive: true,
          startDate: {
            $lte: now,
          },
          endDate: {
            $gte: now,
          },
        }).lean();

      if (!promotion) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This promotion is no longer active.",
          },
          { status: 400 }
        );
      }

      /* ---------------------------------------------------
         Promotion must belong to selected plan
      --------------------------------------------------- */

      if (
        !promotion.membershipPlan ||
        String(
          promotion.membershipPlan
        ) !==
          String(membershipPlan._id)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This promotion is not valid for the selected membership plan.",
          },
          { status: 400 }
        );
      }

      const offerPrice =
        Number(promotion.offerPrice);

      const normalPrice =
        Number(membershipPlan.price);

      if (
        !Number.isFinite(offerPrice) ||
        offerPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid promotion price.",
          },
          { status: 400 }
        );
      }

      /* ---------------------------------------------------
         Promotion cannot increase price
      --------------------------------------------------- */

      if (offerPrice > normalPrice) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promotion price cannot exceed the normal membership price.",
          },
          { status: 400 }
        );
      }

      /* ---------------------------------------------------
         Apply promotion price
      --------------------------------------------------- */

      membershipPrice = offerPrice;

      discount = Math.max(
        0,
        normalPrice - offerPrice
      );

      /* ---------------------------------------------------
         Registration fee waiver
      --------------------------------------------------- */

      if (
        promotion.registrationFeeWaived ===
        true
      ) {
        registrationFee = 0;
      }
    }

    /* =====================================================
       16. FINAL TOTAL
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
       17. HASH PASSWORD
    ===================================================== */

    const passwordHash =
      await bcrypt.hash(
        cleanPassword,
        12
      );

    /* =====================================================
       18. CREATE PURCHASE ORDER
    ===================================================== */

    const now = new Date();

    /*
     * UPI:
     * 15-minute payment window.
     *
     * Cash:
     * no automatic expiration because the
     * customer pays at the gym.
     */

    const expiresAt =
      paymentMethod === "upi"
        ? addMinutes(
            now,
            PURCHASE_EXPIRY_MINUTES
          )
        : null;

    const orderNumber =
      generateOrderNumber();

    const purchaseOrder =
      await PurchaseOrder.create({
        orderNumber,

        name: cleanName,

        email: cleanEmail,

        phone: cleanPhone,

        gender,

        passwordHash,

        emergencyContactName:
          cleanEmergencyName,

        emergencyContactPhone:
          cleanEmergencyPhone,

        emergencyContactRelation:
          cleanEmergencyRelation,

        membershipPlan:
          membershipPlan._id,

        /*
         * Snapshot duration at purchase time.
         */

        durationInDays,

        membershipType,

        partner: cleanPartner,

        selectedAddOns:
          selectedAddOnSnapshots,

        promotion:
          promotion
            ? promotion._id
            : null,

        membershipPrice,

        addOnsTotal,

        registrationFee,

        discount,

        totalAmount,

        paymentMethod,

        status:
          paymentMethod === "upi"
            ? "payment_pending"
            : "cash_pending",

        expiresAt,

        notes: "",
      });

    /* =====================================================
       19. RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          paymentMethod === "upi"
            ? "Purchase order created. Continue with payment."
            : "Purchase request submitted. Please wait for the gym admin to confirm your cash payment.",

        purchaseOrder: {
          id: purchaseOrder._id,

          orderNumber:
            purchaseOrder.orderNumber,

          status:
            purchaseOrder.status,

          paymentMethod:
            purchaseOrder.paymentMethod,

          membershipPlan: {
            id: membershipPlan._id,

            name: membershipPlan.name,

            price:
              membershipPlan.price,

            durationInDays,
          },

          membershipPrice,

          addOnsTotal,

          registrationFee,

          discount,

          totalAmount,

          expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "PUBLIC PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create purchase request. Please try again.",
      },
      { status: 500 }
    );
  }
}