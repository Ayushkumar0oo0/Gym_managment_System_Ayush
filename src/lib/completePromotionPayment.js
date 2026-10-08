import User from "@/models/User";
import Payment from "@/models/Payment";
import Promotion from "@/models/Promotion";
import Membership from "@/models/Membership";

const REGISTRATION_FEE = 500;

/* ============================================================
   DATABASE HELPERS
============================================================ */

async function saveWithSession(document, session) {
  if (session) {
    await document.save({ session });
  } else {
    await document.save();
  }
}

async function createMembershipWithSession(data, session) {
  if (session) {
    const created = await Membership.create([data], { session });
    return created[0];
  }

  return Membership.create(data);
}

/* ============================================================
   NOTE SNAPSHOT HELPERS
============================================================ */

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractAmountFromNotes(notes, label) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const escapedLabel = escapeRegex(label);

  const regex = new RegExp(
    `${escapedLabel}\\s*:\\s*₹?\\s*([0-9]+(?:\\.[0-9]+)?)`,
    "i"
  );

  const match = notes.match(regex);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return amount;
}

function extractIntegerFromNotes(notes, label) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const escapedLabel = escapeRegex(label);

  const regex = new RegExp(
    `${escapedLabel}\\s*:\\s*([0-9]+)`,
    "i"
  );

  const match = notes.match(regex);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  if (!Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

function extractBooleanFromNotes(notes, label) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const escapedLabel = escapeRegex(label);

  const regex = new RegExp(
    `${escapedLabel}\\s*:\\s*(yes|no)`,
    "i"
  );

  const match = notes.match(regex);

  if (!match) {
    return null;
  }

  return match[1].toLowerCase() === "yes";
}

function extractDateFromNotes(notes, label) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const escapedLabel = escapeRegex(label);

  const regex = new RegExp(
    `${escapedLabel}\\s*:\\s*([^|]+)`,
    "i"
  );

  const match = notes.match(regex);

  if (!match) {
    return null;
  }

  const date = new Date(match[1].trim());

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* ============================================================
   VALIDATION HELPERS
============================================================ */

function validateAmount(amount, label) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} is invalid.`);
  }

  return value;
}

function validateDuration(days, label = "Membership duration") {
  const value = Number(days);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} is invalid.`);
  }

  return value;
}

function validateExtensionDays(days) {
  const value = Number(days);

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 3650
  ) {
    throw new Error("Extension days are invalid.");
  }

  return value;
}

function getPaymentNotes(payment) {
  return typeof payment.notes === "string"
    ? payment.notes
    : "";
}

/* ============================================================
   MAIN FUNCTION
============================================================ */

export async function completePromotionPayment(
  paymentId,
  mongoSession
) {
  /* ==========================================================
     1. FIND PAYMENT
  ========================================================== */

  const paymentQuery = Payment.findById(paymentId);

  if (mongoSession) {
    paymentQuery.session(mongoSession);
  }

  const payment = await paymentQuery;

  if (!payment) {
    throw new Error("Payment not found.");
  }

  /* ==========================================================
     2. VALIDATE PAYMENT
  ========================================================== */

  if (payment.paymentType !== "promotion") {
    throw new Error(
      "Payment is not a promotion payment."
    );
  }

  if (payment.status !== "paid") {
    throw new Error(
      "Payment has not been verified as paid."
    );
  }

  if (!payment.promotion) {
    throw new Error(
      "Payment is not connected to a promotion."
    );
  }

  if (!payment.user) {
    throw new Error(
      "Payment is not connected to a user."
    );
  }

  /* ==========================================================
     3. FIND USER
  ========================================================== */

  const userQuery = User.findById(payment.user);

  if (mongoSession) {
    userQuery.session(mongoSession);
  }

  const user = await userQuery;

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive.");
  }

  if (user.role !== "member") {
    throw new Error("User is not a member.");
  }

  /* ==========================================================
     4. FIND PROMOTION
  ========================================================== */

  const promotionQuery = Promotion.findById(
    payment.promotion
  ).populate("membershipPlan");

  if (mongoSession) {
    promotionQuery.session(mongoSession);
  }

  const promotion = await promotionQuery;

  if (!promotion) {
    throw new Error("Promotion no longer exists.");
  }

  /*
   * Do NOT check isActive/date here.
   *
   * The customer has already paid.
   * Historical payment snapshots must remain valid.
   */

  const notes = getPaymentNotes(payment);

  /* ==========================================================
     5. MEMBERSHIP PROMOTION
  ========================================================== */

  if (promotion.type === "membership") {
    if (!promotion.membershipPlan) {
      throw new Error(
        "Membership plan is missing."
      );
    }

    const plan = promotion.membershipPlan;

    /* --------------------------------------------------------
       Eligibility
    -------------------------------------------------------- */

    if (
      plan.eligibility &&
      plan.eligibility !== "both" &&
      plan.eligibility !== user.gender
    ) {
      throw new Error(
        "Member is not eligible for this plan."
      );
    }

    /* --------------------------------------------------------
       Historical promotion price
    -------------------------------------------------------- */

    const historicalOfferPrice =
      extractAmountFromNotes(
        notes,
        "Promotion offer price"
      );

    const offerPrice =
      historicalOfferPrice !== null
        ? historicalOfferPrice
        : Number(promotion.offerPrice);

    validateAmount(
      offerPrice,
      "Promotion price"
    );

    /* --------------------------------------------------------
       Historical duration
    -------------------------------------------------------- */

    const historicalDuration =
      extractIntegerFromNotes(
        notes,
        "Plan duration at purchase"
      );

    const durationInDays =
      historicalDuration !== null
        ? historicalDuration
        : Number(plan.durationInDays);

    validateDuration(
      durationInDays,
      "Membership plan duration"
    );

    /* --------------------------------------------------------
       Historical registration fee
    -------------------------------------------------------- */

    const historicalRegistrationFee =
      extractAmountFromNotes(
        notes,
        "Registration fee"
      );

    const historicalWaived =
      extractBooleanFromNotes(
        notes,
        "Registration fee waived"
      );

    let registrationFee;

    if (historicalRegistrationFee !== null) {
      registrationFee = historicalRegistrationFee;
    } else if (historicalWaived === true) {
      registrationFee = 0;
    } else {
      registrationFee =
        !user.registrationFeePaid &&
        !promotion.registrationFeeWaived
          ? REGISTRATION_FEE
          : 0;
    }

    validateAmount(
      registrationFee,
      "Registration fee"
    );

    /* --------------------------------------------------------
       Verify payment amount
    -------------------------------------------------------- */

    const expectedAmount =
      offerPrice + registrationFee;

    const actualAmount =
      Number(payment.amount);

    if (
      !Number.isFinite(actualAmount) ||
      actualAmount !== expectedAmount
    ) {
      throw new Error(
        `Payment amount mismatch. Expected ₹${expectedAmount}, received ₹${payment.amount}.`
      );
    }

    /* --------------------------------------------------------
       Idempotency
    -------------------------------------------------------- */

    if (payment.membership) {
      const existingMembershipQuery =
        Membership.findById(
          payment.membership
        );

      if (mongoSession) {
        existingMembershipQuery.session(
          mongoSession
        );
      }

      const existingMembership =
        await existingMembershipQuery;

      if (existingMembership) {
        return {
          type: "membership",
          alreadyCompleted: true,

          membership: {
            id: existingMembership._id,
            plan: plan.name,
            startDate:
              existingMembership.startDate,
            endDate:
              existingMembership.endDate,
            durationInDays,
            price:
              existingMembership.priceAtPurchase,
          },

          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status,
            method: payment.method,
          },

          registrationFee: {
            amount: registrationFee,
            waived: registrationFee === 0,
            updated: false,
          },
        };
      }

      throw new Error(
        "Payment is linked to a membership that could not be found."
      );
    }

    /* --------------------------------------------------------
       Prevent duplicate active membership
    -------------------------------------------------------- */

    const activeMembershipQuery =
      Membership.findOne({
        $or: [
          {
            user: user._id,
          },
          {
            secondaryUser: user._id,
          },
        ],

        status: "active",

        endDate: {
          $gte: new Date(),
        },
      });

    if (mongoSession) {
      activeMembershipQuery.session(
        mongoSession
      );
    }

    const activeMembership =
      await activeMembershipQuery;

    if (activeMembership) {
      throw new Error(
        "User already has an active membership."
      );
    }

    /* --------------------------------------------------------
       Create membership
    -------------------------------------------------------- */

    const startDate = new Date();

    const endDate = new Date(startDate);

    endDate.setUTCDate(
      endDate.getUTCDate() +
        durationInDays
    );

    if (endDate <= startDate) {
      throw new Error(
        "Calculated membership end date is invalid."
      );
    }

    const membershipData = {
      user: user._id,

      plan: plan._id,

      membershipType: "individual",

      secondaryUser: null,

      coupleStatus: null,

      selectedAddOns: [],

      startDate,

      endDate,

      status: "active",

      priceAtPurchase: offerPrice,

      extensions: [],
    };

    const membership =
      await createMembershipWithSession(
        membershipData,
        mongoSession
      );

    if (!membership) {
      throw new Error(
        "Failed to create membership."
      );
    }

    /* --------------------------------------------------------
       Registration fee
    -------------------------------------------------------- */

    let registrationFeeUpdated = false;

    if (
      registrationFee > 0 &&
      !user.registrationFeePaid
    ) {
      user.registrationFeePaid = true;
      user.registrationFeePaidAt = new Date();

      await saveWithSession(
        user,
        mongoSession
      );

      registrationFeeUpdated = true;
    }

    /* --------------------------------------------------------
       Connect payment
    -------------------------------------------------------- */

    payment.membership =
      membership._id;

    await saveWithSession(
      payment,
      mongoSession
    );

    return {
      type: "membership",
      alreadyCompleted: false,

      membership: {
        id: membership._id,
        plan: plan.name,
        startDate: membership.startDate,
        endDate: membership.endDate,
        durationInDays,
        price:
          membership.priceAtPurchase,
      },

      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
      },

      registrationFee: {
        amount: registrationFee,
        waived: registrationFee === 0,
        updated: registrationFeeUpdated,
      },
    };
  }

  /* ==========================================================
     6. EXTENSION PROMOTION
  ========================================================== */

  if (promotion.type === "extension") {
    /* --------------------------------------------------------
       Extension days
    -------------------------------------------------------- */

    const historicalExtensionDays =
      extractIntegerFromNotes(
        notes,
        "Extension days"
      );

    const extensionDays =
      historicalExtensionDays !== null
        ? historicalExtensionDays
        : Number(
            promotion.extensionDays
          );

    validateExtensionDays(
      extensionDays
    );

    /* --------------------------------------------------------
       Historical offer price
    -------------------------------------------------------- */

    const historicalOfferPrice =
      extractAmountFromNotes(
        notes,
        "Offer price"
      );

    const offerPrice =
      historicalOfferPrice !== null
        ? historicalOfferPrice
        : Number(promotion.offerPrice);

    validateAmount(
      offerPrice,
      "Promotion price"
    );

    /* --------------------------------------------------------
       Verify payment amount
    -------------------------------------------------------- */

    const actualAmount =
      Number(payment.amount);

    if (
      !Number.isFinite(actualAmount) ||
      actualAmount !== offerPrice
    ) {
      throw new Error(
        `Payment amount mismatch. Expected ₹${offerPrice}, received ₹${payment.amount}.`
      );
    }

    /* --------------------------------------------------------
       Membership required
    -------------------------------------------------------- */

    if (!payment.membership) {
      throw new Error(
        "Payment is not connected to a membership."
      );
    }

    /* --------------------------------------------------------
       Find membership
    -------------------------------------------------------- */

    const membershipQuery =
      Membership.findOne({
        _id: payment.membership,

        $or: [
          {
            user: user._id,
          },
          {
            secondaryUser: user._id,
          },
        ],
      });

    if (mongoSession) {
      membershipQuery.session(
        mongoSession
      );
    }

    const membership =
      await membershipQuery;

    if (!membership) {
      throw new Error(
        "Membership associated with this payment was not found."
      );
    }

    /* --------------------------------------------------------
       Membership must be active
    -------------------------------------------------------- */

    if (membership.status !== "active") {
      throw new Error(
        "This membership is no longer active."
      );
    }

    /* --------------------------------------------------------
       Validate end date
    -------------------------------------------------------- */

    const oldEndDate =
      new Date(membership.endDate);

    if (
      Number.isNaN(
        oldEndDate.getTime()
      )
    ) {
      throw new Error(
        "Membership end date is invalid."
      );
    }

    /* --------------------------------------------------------
       Idempotency
    -------------------------------------------------------- */

    const existingExtension =
      Array.isArray(
        membership.extensions
      )
        ? membership.extensions.find(
            (extension) =>
              extension?.payment &&
              String(
                extension.payment
              ) ===
                String(payment._id)
          )
        : null;

    if (existingExtension) {
      return {
        type: "extension",
        alreadyCompleted: true,

        membership: {
          id: membership._id,
          oldEndDate:
            existingExtension.oldEndDate,
          newEndDate:
            existingExtension.newEndDate,
          daysAdded:
            existingExtension.daysAdded,
        },

        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
        },
      };
    }

    /* --------------------------------------------------------
       Calculate new end date
    -------------------------------------------------------- */

    const newEndDate =
      new Date(oldEndDate);

    newEndDate.setUTCDate(
      newEndDate.getUTCDate() +
        extensionDays
    );

    if (newEndDate <= oldEndDate) {
      throw new Error(
        "Calculated extension end date is invalid."
      );
    }

    /* --------------------------------------------------------
       Extension history
    -------------------------------------------------------- */

    if (
      !Array.isArray(
        membership.extensions
      )
    ) {
      membership.extensions = [];
    }

    membership.extensions.push({
      daysAdded: extensionDays,

      oldEndDate,

      newEndDate,

      reason:
        `Promotion: ${promotion.title}`,

      source: "promotion",

      promotion:
        promotion._id,

      payment:
        payment._id,

      approvedBy:
        payment.method === "cash"
          ? payment.receivedBy ||
            payment.recordedBy ||
            null
          : null,
    });

    /* --------------------------------------------------------
       Update membership
    -------------------------------------------------------- */

    membership.endDate =
      newEndDate;

    membership.status =
      "active";

    await saveWithSession(
      membership,
      mongoSession
    );

    return {
      type: "extension",
      alreadyCompleted: false,

      membership: {
        id: membership._id,
        oldEndDate,
        newEndDate,
        daysAdded:
          extensionDays,
      },

      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
      },
    };
  }

  /* ==========================================================
     7. INVALID PROMOTION TYPE
  ========================================================== */

  throw new Error(
    "Invalid promotion type."
  );
}