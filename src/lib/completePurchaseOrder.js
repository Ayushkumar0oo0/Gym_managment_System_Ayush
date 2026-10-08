import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import User from "@/models/User";
import Membership from "@/models/Membership";
import Payment from "@/models/Payment";
import PurchaseOrder from "@/models/PurchaseOrder";
import MembershipPlan from "@/models/MembershipPlan";

/* =========================================================
   HELPERS
========================================================= */

function generateTemporaryPassword() {
  return crypto.randomBytes(32).toString("hex");
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function roundMoney(value) {
  return Math.round(Number(value) * 100);
}

/* =========================================================
   COMPLETE PURCHASE ORDER
========================================================= */

export async function completePurchaseOrder({
  purchaseOrderId,
  session,
  paymentMethod,
  gatewayPaymentId = null,
  gatewayOrderId = null,
  transactionId = null,
  recordedBy = null,
  receivedBy = null,
}) {
  /* =======================================================
     1. BASIC VALIDATION
  ======================================================= */

  if (!session) {
    throw new Error(
      "A MongoDB transaction session is required to complete a purchase order."
    );
  }

  if (
    !purchaseOrderId ||
    !isValidObjectId(purchaseOrderId)
  ) {
    throw new Error("Invalid purchase order ID.");
  }

  if (!["upi", "cash"].includes(paymentMethod)) {
    throw new Error("Invalid payment method.");
  }

  /* =======================================================
     2. LOAD PURCHASE ORDER
  ======================================================= */

  const purchaseOrder =
    await PurchaseOrder.findById(purchaseOrderId)
      .select("+passwordHash")
      .session(session);

  if (!purchaseOrder) {
    throw new Error("Purchase order not found.");
  }

  /* =======================================================
     3. IDEMPOTENCY
  ======================================================= */

  if (
    purchaseOrder.status === "completed" &&
    purchaseOrder.user &&
    purchaseOrder.membership &&
    purchaseOrder.payment
  ) {
    return {
      alreadyCompleted: true,
      purchaseOrder,
      user: purchaseOrder.user,
      secondaryUser: null,
      membership: purchaseOrder.membership,
      payment: purchaseOrder.payment,
    };
  }

  /* =======================================================
     4. VALIDATE STATUS
  ======================================================= */

  const allowedStatuses =
    paymentMethod === "upi"
      ? ["payment_pending"]
      : ["cash_pending"];

  if (
    !allowedStatuses.includes(
      purchaseOrder.status
    )
  ) {
    throw new Error(
      `Purchase order cannot be completed from status "${purchaseOrder.status}".`
    );
  }

  /* =======================================================
     5. VALIDATE PAYMENT METHOD
  ======================================================= */

  if (
    purchaseOrder.paymentMethod !==
    paymentMethod
  ) {
    throw new Error(
      "Payment method does not match the purchase order."
    );
  }

  /* =======================================================
     6. EXPIRATION
  ======================================================= */

  if (
    purchaseOrder.expiresAt &&
    new Date(
      purchaseOrder.expiresAt
    ).getTime() <= Date.now()
  ) {
    await PurchaseOrder.updateOne(
      {
        _id: purchaseOrder._id,
        status: purchaseOrder.status,
      },
      {
        $set: {
          status: "expired",
        },
      },
      { session }
    );

    throw new Error(
      "Purchase order has expired."
    );
  }

  /* =======================================================
     7. VALIDATE AMOUNTS
  ======================================================= */

  const membershipPrice = Number(
    purchaseOrder.membershipPrice
  );

  const addOnsTotal = Number(
    purchaseOrder.addOnsTotal
  );

  const registrationFee = Number(
    purchaseOrder.registrationFee
  );

  const discount = Number(
    purchaseOrder.discount || 0
  );

  const totalAmount = Number(
    purchaseOrder.totalAmount
  );

  if (
    !Number.isFinite(membershipPrice) ||
    !Number.isFinite(addOnsTotal) ||
    !Number.isFinite(registrationFee) ||
    !Number.isFinite(discount) ||
    !Number.isFinite(totalAmount)
  ) {
    throw new Error(
      "Invalid purchase amount."
    );
  }

  if (
    membershipPrice < 0 ||
    addOnsTotal < 0 ||
    registrationFee < 0 ||
    discount < 0 ||
    totalAmount < 0
  ) {
    throw new Error(
      "Purchase amount cannot be negative."
    );
  }

  const calculatedTotal =
    membershipPrice +
    addOnsTotal +
    registrationFee;

  if (
    roundMoney(calculatedTotal) !==
    roundMoney(totalAmount)
  ) {
    throw new Error(
      "Purchase amount mismatch."
    );
  }

  /* =======================================================
     8. PASSWORD
  ======================================================= */

  if (!purchaseOrder.passwordHash) {
    throw new Error(
      "Purchase order password is missing."
    );
  }

  /* =======================================================
     9. MEMBERSHIP PLAN
  ======================================================= */

  const membershipPlan =
    await MembershipPlan.findById(
      purchaseOrder.membershipPlan
    ).session(session);

  if (!membershipPlan) {
    throw new Error(
      "Membership plan no longer exists."
    );
  }

  const planPrice = Number(
    membershipPlan.price
  );

  /*
   * Use the duration captured in the purchase
   * order rather than the current plan duration.
   */
  const planDuration = Number(
    purchaseOrder.durationInDays
  );

  if (
    !Number.isFinite(planPrice) ||
    planPrice < 0
  ) {
    throw new Error(
      "Membership plan has an invalid price."
    );
  }

  if (
    !Number.isInteger(planDuration) ||
    planDuration < 1
  ) {
    throw new Error(
      "Purchase order has an invalid membership duration."
    );
  }

  /* =======================================================
     10. PLAN ELIGIBILITY
  ======================================================= */

  if (
    membershipPlan.eligibility !== "both" &&
    membershipPlan.eligibility !==
      purchaseOrder.gender
  ) {
    throw new Error(
      "Membership plan is not available for the selected gender."
    );
  }

  if (
    purchaseOrder.membershipType ===
      "couple" &&
    membershipPlan.eligibility !== "both"
  ) {
    throw new Error(
      "This membership plan cannot be used for a couple membership."
    );
  }

  /* =======================================================
     11. PRIMARY CONTACT DETAILS
  ======================================================= */

  const primaryEmail = normalizeEmail(
    purchaseOrder.email
  );

  const primaryPhone = normalizePhone(
    purchaseOrder.phone
  );

  if (!primaryEmail || !primaryPhone) {
    throw new Error(
      "Purchase order contains invalid contact details."
    );
  }

  /* =======================================================
     12. CHECK EXISTING PRIMARY ACCOUNT
  ======================================================= */

  const existingPrimaryUser =
  await User.findOne({
    $or: [
      {
        email: primaryEmail,
      },
      {
        phone: primaryPhone,
      },
    ],
  }).session(session);

  if (
    existingPrimaryUser &&
    existingPrimaryUser.role !== "member"
  ) {
    throw new Error(
      "An account already exists with this email address or phone number."
    );
  }

  if (
    existingPrimaryUser &&
    existingPrimaryUser.isActive
  ) {
    throw new Error(
      "An active member account already exists with this email address or phone number."
    );
  }

  /* =======================================================
     13. REGISTRATION FEE STATE
  ======================================================= */

  const registrationFeePaid =
    registrationFee > 0;

  const registrationFeeWaived =
    registrationFee === 0 &&
    Boolean(purchaseOrder.promotion);

  if (
    registrationFee === 0 &&
    !purchaseOrder.promotion
  ) {
    throw new Error(
      "Registration fee is zero but no valid promotion is attached."
    );
  }

  /* =========================================================
     14. CREATE PRIMARY USER
  ========================================================= */

  let primaryUser;

  if (existingPrimaryUser) {
    // =======================================================
    // REACTIVATE EXISTING INACTIVE MEMBER
    // =======================================================

    primaryUser = existingPrimaryUser;

    primaryUser.isActive = true;

    // Keep the existing account/history, but update
    // the current contact/profile information.
    primaryUser.name = purchaseOrder.name;
    primaryUser.email = primaryEmail;
    primaryUser.phone = primaryPhone;
    primaryUser.gender = purchaseOrder.gender;

    primaryUser.emergencyContactName =
      purchaseOrder.emergencyContactName || "";

    primaryUser.emergencyContactPhone =
      purchaseOrder.emergencyContactPhone || "";

    primaryUser.emergencyContactRelation =
      purchaseOrder.emergencyContactRelation || "";

    // The new purchase has a registration fee only when
    // the purchase order actually contains one.
    if (registrationFeePaid) {
      primaryUser.registrationFeePaid = true;
      primaryUser.registrationFeePaidAt = new Date();
    }

    if (registrationFeeWaived) {
      primaryUser.registrationFeeWaived = true;
    }

    await primaryUser.save({
      session,
    });
  } else {
    // =======================================================
    // CREATE NEW MEMBER ACCOUNT
    // =======================================================

    primaryUser = new User({
      name: purchaseOrder.name,

      email: primaryEmail,

      phone: primaryPhone,

      password: purchaseOrder.passwordHash,

      role: "member",

      isActive: true,

      gender: purchaseOrder.gender,

      registrationFeePaid,

      registrationFeePaidAt: registrationFeePaid
        ? new Date()
        : null,

      registrationFeeWaived,

      emergencyContactName:
        purchaseOrder.emergencyContactName || "",

      emergencyContactPhone:
        purchaseOrder.emergencyContactPhone || "",

      emergencyContactRelation:
        purchaseOrder.emergencyContactRelation || "",
    });

    await primaryUser.save({
      session,
    });
  }

  /* =======================================================
     15. COUPLE SECONDARY USER
  ======================================================= */

  let secondaryUser = null;

  if (
    purchaseOrder.membershipType ===
    "couple"
  ) {
    const partner =
      purchaseOrder.partner;

    if (
      !partner ||
      !partner.name ||
      !partner.email ||
      !partner.phone ||
      !partner.gender
    ) {
      throw new Error(
        "Complete partner information is required for a couple membership."
      );
    }

    const partnerEmail =
      normalizeEmail(partner.email);

    const partnerPhone =
      normalizePhone(partner.phone);

    if (partnerEmail === primaryEmail) {
      throw new Error(
        "Primary member and partner must use different email addresses."
      );
    }

    if (partnerPhone === primaryPhone) {
      throw new Error(
        "Primary member and partner must use different phone numbers."
      );
    }

    if (
      partner.gender ===
      purchaseOrder.gender
    ) {
      throw new Error(
        "Couple members must have different genders."
      );
    }

    /* -------------------------------------------------------
       CHECK PARTNER ACCOUNT
    ------------------------------------------------------- */

    const existingPartnerUser =
      await User.findOne({
        $or: [
          {
            email: partnerEmail,
          },
          {
            phone: partnerPhone,
          },
        ],
      }).session(session);

    if (
      existingPartnerUser &&
      existingPartnerUser.role !== "member"
    ) {
      throw new Error(
        "An account already exists with the partner's email address or phone number."
      );
    }

    if (
      existingPartnerUser &&
      existingPartnerUser.isActive
    ) {
      throw new Error(
        "An active member account already exists with the partner's email address or phone number."
      );
    }

    /* -------------------------------------------------------
       TEMPORARY PASSWORD
    ------------------------------------------------------- */

    const temporaryPassword =
      generateTemporaryPassword();

    const temporaryPasswordHash =
      await bcrypt.hash(
        temporaryPassword,
        12
      );

    /* -------------------------------------------------------
       CREATE SECONDARY USER
    ------------------------------------------------------- */

    if (existingPartnerUser) {
      // =======================================================
      // REACTIVATE EXISTING INACTIVE PARTNER
      // =======================================================

      secondaryUser = existingPartnerUser;

      secondaryUser.isActive = true;
      secondaryUser.name = partner.name;
      secondaryUser.email = partnerEmail;
      secondaryUser.phone = partnerPhone;
      secondaryUser.gender = partner.gender;

      await secondaryUser.save({
        session,
      });
    } else {
      // =======================================================
      // CREATE NEW PARTNER ACCOUNT
      // =======================================================

      secondaryUser = new User({
        name: partner.name,

        email: partnerEmail,

        phone: partnerPhone,

        password: temporaryPasswordHash,

        role: "member",

        isActive: true,

        gender: partner.gender,

        registrationFeePaid: false,

        registrationFeePaidAt: null,

        registrationFeeWaived: true,
      });

      await secondaryUser.save({
        session,
      });
    }
  }

  /* =======================================================
     16. VALIDATE SELECTED ADD-ONS
  ======================================================= */

  const selectedAddOnSnapshots =
    Array.isArray(
      purchaseOrder.selectedAddOns
    )
      ? purchaseOrder.selectedAddOns
      : [];

  let calculatedAddOnsTotal = 0;

  const selectedAddOns =
    selectedAddOnSnapshots.map(
      (item) => {
        const price = Number(
          item.priceAtPurchase
        );

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          throw new Error(
            "Invalid add-on price."
          );
        }

        if (!item.addOn) {
          throw new Error(
            "Invalid add-on."
          );
        }

        calculatedAddOnsTotal += price;

        return {
          addOn: item.addOn,
          name: item.name,
          priceAtPurchase: price,
        };
      }
    );

  if (
    roundMoney(
      calculatedAddOnsTotal
    ) !==
    roundMoney(addOnsTotal)
  ) {
    throw new Error(
      "Add-on amount mismatch."
    );
  }

  /* =======================================================
     17. CREATE MEMBERSHIP
  ======================================================= */

  const startDate = new Date();

  const endDate = addDays(
    startDate,
    planDuration
  );

  const coupleStatus =
    purchaseOrder.membershipType ===
    "couple"
      ? "couple"
      : null;

  const membership =
    new Membership({
      user: primaryUser._id,

      secondaryUser:
        secondaryUser
          ? secondaryUser._id
          : null,

      plan: membershipPlan._id,

      membershipType:
        purchaseOrder.membershipType,

      coupleStatus,

      selectedAddOns,

      startDate,

      endDate,

      status: "active",

      priceAtPurchase:
        membershipPrice,

      extensions: [],
    });

  await membership.save({
    session,
  });

  /* =======================================================
     18. CREATE PAYMENT
  ======================================================= */

  const paymentNotes = [
    `Purchase order: ${purchaseOrder.orderNumber}`,
    `Membership: ₹${membershipPrice}`,
    `Add-ons: ₹${addOnsTotal}`,
    `Registration fee: ₹${registrationFee}`,
    `Discount: ₹${discount}`,
    `Duration: ${planDuration} days`,
  ].join(" | ");

  const payment = new Payment({
    user: primaryUser._id,

    membership: membership._id,

    membershipPlan:
      membershipPlan._id,

    membershipStartDate:
      startDate,

    promotion:
      purchaseOrder.promotion ||
      null,

    paymentType: "membership",

    amount: totalAmount,

    method: paymentMethod,

    status: "paid",

    gatewayOrderId:
      paymentMethod === "upi"
        ? gatewayOrderId ||
          purchaseOrder.gatewayOrderId
        : null,

    gatewayPaymentId:
      paymentMethod === "upi"
        ? gatewayPaymentId
        : null,

    transactionId:
      transactionId || null,

    paidAt: new Date(),

    recordedBy:
      recordedBy || null,

    receivedBy:
      receivedBy || null,

    notes: paymentNotes,
  });

  await payment.save({
    session,
  });

  /* =======================================================
     19. COMPLETE PURCHASE ORDER
     
     IMPORTANT:
     Use updateOne + $unset instead of:
       passwordHash = undefined
       purchaseOrder.save()
     
     because passwordHash is required in the schema.
  ======================================================= */

  const purchaseOrderUpdate = {
    user: primaryUser._id,

    membership: membership._id,

    payment: payment._id,

    status: "completed",

    confirmedAt: new Date(),
  };

  if (recordedBy) {
    purchaseOrderUpdate.confirmedBy =
      recordedBy;
  }

  if (gatewayOrderId) {
    purchaseOrderUpdate.gatewayOrderId =
      gatewayOrderId;
  }

  if (gatewayPaymentId) {
    purchaseOrderUpdate.gatewayPaymentId =
      gatewayPaymentId;
  }

  await PurchaseOrder.updateOne(
    {
      _id: purchaseOrder._id,
    },
    {
      $set: purchaseOrderUpdate,

      /*
       * Remove the stored password hash after
       * the member account has been created.
       */
      $unset: {
        passwordHash: 1,
      },
    },
    {
      session,
    }
  );

  /*
   * Keep the in-memory object consistent.
   */
  purchaseOrder.user =
    primaryUser._id;

  purchaseOrder.membership =
    membership._id;

  purchaseOrder.payment =
    payment._id;

  purchaseOrder.status =
    "completed";

  purchaseOrder.confirmedAt =
    purchaseOrderUpdate.confirmedAt;

  if (recordedBy) {
    purchaseOrder.confirmedBy =
      recordedBy;
  }

  if (gatewayOrderId) {
    purchaseOrder.gatewayOrderId =
      gatewayOrderId;
  }

  if (gatewayPaymentId) {
    purchaseOrder.gatewayPaymentId =
      gatewayPaymentId;
  }

  purchaseOrder.passwordHash =
    undefined;

  /* =======================================================
     20. RETURN
  ======================================================= */

  return {
    alreadyCompleted: false,

    purchaseOrder,

    user: primaryUser,

    secondaryUser,

    membership,

    payment,
  };
}