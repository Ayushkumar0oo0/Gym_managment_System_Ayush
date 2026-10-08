import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Payment from "@/models/Payment";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import Promotion from "@/models/Promotion";

import { completePromotionPayment } from "@/lib/completePromotionPayment";

import {
  adminRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

const REGISTRATION_FEE = 500;

/**
 * Extract a numeric value from payment notes.
 */
function extractNumberFromNotes(notes, pattern) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const match = notes.match(pattern);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);

  return Number.isFinite(value) ? value : null;
}

/**
 * Read historical membership plan price from Payment.notes.
 */
function extractPlanPriceFromNotes(notes) {
  return extractNumberFromNotes(
    notes,
    /Plan price:\s*₹?\s*([0-9]+(?:\.[0-9]+)?)/i
  );
}

/**
 * Read historical membership duration from Payment.notes.
 */
function extractDurationFromNotes(notes) {
  const duration = extractNumberFromNotes(
    notes,
    /Duration:\s*(\d+)\s*days/i
  );

  if (
    duration === null ||
    !Number.isInteger(duration) ||
    duration < 1
  ) {
    return null;
  }

  return duration;
}

/**
 * Read renewal start date from Payment.notes.
 *
 * Example:
 * "Renewal start: 2026-10-07T00:00:00.000Z"
 */
function extractRenewalStartFromNotes(notes) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const match = notes.match(
    /Renewal start:\s*([0-9T:.\-+Z]+)\b/i
  );

  if (!match) {
    return null;
  }

  const date = new Date(match[1]);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request, { params }) {
  let mongoSession = null;

  try {
    // =========================================================
    // 1. AUTHENTICATION
    // =========================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 2. ADMIN RATE LIMIT
    // =========================================================

    const clientIp = getClientIp(request);

    const rateLimitResult = await adminRateLimit.limit(
      createRateLimitIdentifier(
        "admin-cash-payment",
        `${session.user.id}:${clientIp}`
      )
    );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // =========================================================
    // 3. PARAMS
    // =========================================================

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 4. DATABASE
    // =========================================================

    await connectDB();

    // =========================================================
    // 5. VERIFY CURRENT ADMIN
    // =========================================================

    const currentAdmin = await User.findOne({
      _id: session.user.id,
      role: "admin",
      isActive: true,
    }).select("_id name email");

    if (!currentAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your admin account is inactive or unavailable.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 6. START TRANSACTION
    // =========================================================

    mongoSession = await mongoose.startSession();

    let result = null;

    await mongoSession.withTransaction(async () => {
      // =======================================================
      // FIND PAYMENT
      // =======================================================

      const payment = await Payment.findById(id).session(
        mongoSession
      );

      if (!payment) {
        throw new Error("Payment not found.");
      }

      // =======================================================
      // CASH ONLY
      // =======================================================

      if (payment.method !== "cash") {
        throw new Error(
          "Only cash payments can be confirmed by admin."
        );
      }

      // =======================================================
      // PENDING ONLY
      // =======================================================

      if (payment.status !== "pending") {
        throw new Error(
          `Payment is already ${payment.status}.`
        );
      }

      // =======================================================
      // SUPPORTED PAYMENT TYPES
      // =======================================================

      const supportedTypes = [
        "membership",
        "renewal",
        "promotion",
      ];

      if (!supportedTypes.includes(payment.paymentType)) {
        throw new Error(
          `Cash confirmation is not supported for payment type "${payment.paymentType}".`
        );
      }

      // =======================================================
      // PROMOTION PAYMENT
      // =======================================================

      if (payment.paymentType === "promotion") {
        if (!payment.promotion) {
          throw new Error(
            "Promotion is missing from this payment."
          );
        }

        const promotion = await Promotion.findById(
          payment.promotion
        ).session(mongoSession);

        if (!promotion) {
          throw new Error(
            "Promotion associated with this payment was not found."
          );
        }

        if (promotion.type !== "extension") {
          throw new Error(
            "This promotion is not an extension promotion."
          );
        }

        const extensionDays = Number(
          promotion.extensionDays
        );

        if (
          !Number.isInteger(extensionDays) ||
          extensionDays < 1 ||
          extensionDays > 3650
        ) {
          throw new Error(
            "Invalid extension duration."
          );
        }

        const offerPrice = Number(
          promotion.offerPrice
        );

        if (
          !Number.isFinite(offerPrice) ||
          offerPrice < 0
        ) {
          throw new Error(
            "Invalid promotion price."
          );
        }

        if (
          Number(payment.amount) !== offerPrice
        ) {
          throw new Error(
            `Payment amount mismatch. Expected ₹${offerPrice}, received ₹${payment.amount}.`
          );
        }

        if (!payment.membership) {
          throw new Error(
            "This extension payment is not connected to a membership."
          );
        }

        if (!payment.user) {
          throw new Error(
            "This promotion payment is not connected to a user."
          );
        }

        const member = await User.findById(
          payment.user
        )
          .select("_id name email phone isActive")
          .session(mongoSession);

        if (!member) {
          throw new Error(
            "The member associated with this payment was not found."
          );
        }

        if (!member.isActive) {
          throw new Error(
            "Member account is inactive."
          );
        }

        const membership = await Membership.findOne({
          _id: payment.membership,
          $or: [
            {
              user: member._id,
            },
            {
              secondaryUser: member._id,
            },
          ],
        }).session(mongoSession);

        if (!membership) {
          throw new Error(
            "Membership associated with this payment was not found."
          );
        }

        const alreadyProcessed = Array.isArray(
          membership.extensions
        )
          ? membership.extensions.some((extension) => {
              if (!extension) {
                return false;
              }

              const extensionPaymentId =
                extension.payment?.toString?.();

              return (
                extensionPaymentId ===
                payment._id.toString()
              );
            })
          : false;

        if (alreadyProcessed) {
          throw new Error(
            "This promotion payment has already been applied to the membership."
          );
        }

        if (membership.status !== "active") {
          throw new Error(
            "This membership is no longer active."
          );
        }

        if (
          !membership.endDate ||
          new Date(membership.endDate) <= new Date()
        ) {
          throw new Error(
            "This membership is no longer active."
          );
        }

        payment.status = "paid";
        payment.paidAt = new Date();
        payment.recordedBy = currentAdmin._id;
        payment.receivedBy = currentAdmin._id;

        if (!payment.transactionId) {
          payment.transactionId =
            `CASH-${payment._id.toString()}`;
        }

        await payment.save({
          session: mongoSession,
        });

        result = await completePromotionPayment(
          payment._id,
          mongoSession
        );

        return;
      }

      // =======================================================
      // NORMAL MEMBERSHIP PAYMENT
      // =======================================================

      if (payment.paymentType === "membership") {
        if (!payment.membershipPlan) {
          throw new Error(
            "Membership plan is missing from payment."
          );
        }

        if (!payment.user) {
          throw new Error(
            "Payment is not connected to a user."
          );
        }

        if (payment.membership) {
          throw new Error(
            "This payment is already linked to a membership."
          );
        }

        const user = await User.findById(
          payment.user
        ).session(mongoSession);

        if (!user) {
          throw new Error("User not found.");
        }

        if (!user.isActive) {
          throw new Error(
            "User account is inactive."
          );
        }

        if (user.role !== "member") {
          throw new Error(
            "Payment user is not a member."
          );
        }

        const plan = await MembershipPlan.findById(
          payment.membershipPlan
        ).session(mongoSession);

        if (!plan) {
          throw new Error(
            "Membership plan not found."
          );
        }

        if (!plan.isActive) {
          throw new Error(
            "Membership plan is no longer active."
          );
        }

        if (
          plan.eligibility !== "both" &&
          plan.eligibility !== user.gender
        ) {
          throw new Error(
            "Member is not eligible for this plan."
          );
        }

        const historicalPlanPrice =
          extractPlanPriceFromNotes(
            payment.notes
          );

        const currentPlanPrice =
          Number(plan.price);

        const planPrice =
          historicalPlanPrice !== null
            ? historicalPlanPrice
            : currentPlanPrice;

        if (
          !Number.isFinite(planPrice) ||
          planPrice < 0
        ) {
          throw new Error(
            "Membership plan price is invalid."
          );
        }

        const historicalDuration =
          extractDurationFromNotes(
            payment.notes
          );

        const currentDuration =
          Number(plan.durationInDays);

        const durationInDays =
          historicalDuration !== null
            ? historicalDuration
            : currentDuration;

        if (
          !Number.isInteger(durationInDays) ||
          durationInDays < 1
        ) {
          throw new Error(
            "Membership plan duration is invalid."
          );
        }

        const activeMembership =
          await Membership.findOne({
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
          }).session(mongoSession);

        if (activeMembership) {
          throw new Error(
            "User already has an active membership."
          );
        }

        const startDate =
          payment.membershipStartDate
            ? new Date(
                payment.membershipStartDate
              )
            : new Date();

        if (
          Number.isNaN(startDate.getTime())
        ) {
          throw new Error(
            "Membership start date is invalid."
          );
        }

        const paymentNotes =
          payment.notes || "";

        const registrationFeeIncluded =
          paymentNotes.includes(
            "₹500 registration fee"
          );

        const registrationFee =
          registrationFeeIncluded
            ? REGISTRATION_FEE
            : 0;

        const expectedAmount =
          planPrice + registrationFee;

        if (
          Number(payment.amount) !==
          expectedAmount
        ) {
          throw new Error(
            `Payment amount mismatch. Expected ₹${expectedAmount}, received ₹${payment.amount}.`
          );
        }

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

        const createdMemberships =
          await Membership.create(
            [
              {
                user: user._id,
                plan: plan._id,
                membershipType: "individual",
                coupleStatus: null,
                selectedAddOns: [],
                startDate,
                endDate,
                status: "active",
                priceAtPurchase: planPrice,
                extensions: [],
              },
            ],
            {
              session: mongoSession,
            }
          );

        const membership =
          createdMemberships[0];

        if (!membership) {
          throw new Error(
            "Failed to create membership."
          );
        }

        payment.status = "paid";
        payment.paidAt = new Date();
        payment.recordedBy = currentAdmin._id;
        payment.receivedBy = currentAdmin._id;
        payment.membership = membership._id;

        if (!payment.transactionId) {
          payment.transactionId =
            `CASH-${payment._id.toString()}`;
        }

        await payment.save({
          session: mongoSession,
        });

        if (
          registrationFeeIncluded &&
          !user.registrationFeePaid
        ) {
          user.registrationFeePaid = true;
          user.registrationFeePaidAt = new Date();

          await user.save({
            session: mongoSession,
          });
        }

        result = {
          type: "membership",

          membership: {
            id: membership._id,
            plan: plan.name,
            startDate: membership.startDate,
            endDate: membership.endDate,
            durationInDays,
            price: membership.priceAtPurchase,
          },

          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status,
            method: payment.method,
            registrationFee,
            recordedBy: currentAdmin._id,
            receivedBy: currentAdmin._id,
          },
        };

        return;
      }

      // =======================================================
      // CASH RENEWAL
      // =======================================================

      if (payment.paymentType === "renewal") {
        if (!payment.membershipPlan) {
          throw new Error(
            "Renewal payment is missing membership plan."
          );
        }

        if (!payment.user) {
          throw new Error(
            "Renewal payment is not connected to a user."
          );
        }

        if (!payment.membership) {
          throw new Error(
            "Renewal payment is not connected to a membership."
          );
        }

        const user = await User.findById(
          payment.user
        ).session(mongoSession);

        if (!user) {
          throw new Error(
            "User not found."
          );
        }

        if (!user.isActive) {
          throw new Error(
            "User account is inactive."
          );
        }

        if (user.role !== "member") {
          throw new Error(
            "Payment user is not a member."
          );
        }

        const membership =
          await Membership.findOne({
            _id: payment.membership,
            $or: [
              {
                user: user._id,
              },
              {
                secondaryUser: user._id,
              },
            ],
          }).session(mongoSession);

        if (!membership) {
          throw new Error(
            "Membership associated with this renewal was not found."
          );
        }

        const plan =
          await MembershipPlan.findById(
            payment.membershipPlan
          ).session(mongoSession);

        if (!plan) {
          throw new Error(
            "Membership plan not found."
          );
        }

        if (
          plan.eligibility !== "both" &&
          plan.eligibility !== user.gender
        ) {
          throw new Error(
            "Member is not eligible for this plan."
          );
        }

        const historicalPlanPrice =
          extractPlanPriceFromNotes(
            payment.notes
          );

        const currentPlanPrice =
          Number(plan.price);

        const planPrice =
          historicalPlanPrice !== null
            ? historicalPlanPrice
            : currentPlanPrice;

        if (
          !Number.isFinite(planPrice) ||
          planPrice < 0
        ) {
          throw new Error(
            "Renewal plan price is invalid."
          );
        }

        const historicalDuration =
          extractDurationFromNotes(
            payment.notes
          );

        const currentDuration =
          Number(plan.durationInDays);

        const durationInDays =
          historicalDuration !== null
            ? historicalDuration
            : currentDuration;

        if (
          !Number.isInteger(durationInDays) ||
          durationInDays < 1
        ) {
          throw new Error(
            "Renewal duration is invalid."
          );
        }

        // Renewal never includes the registration fee.
        if (
          Number(payment.amount) !==
          planPrice
        ) {
          throw new Error(
            `Renewal payment amount mismatch. Expected ₹${planPrice}, received ₹${payment.amount}.`
          );
        }

        // =====================================================
        // IMPORTANT:
        // Use the renewal start date captured when the payment
        // was created.
        //
        // This prevents a cash payment confirmed later from
        // getting a different start time than the customer
        // originally agreed to.
        // =====================================================

        const recordedRenewalStart =
          extractRenewalStartFromNotes(
            payment.notes
          );

        let renewalStartDate;

        if (recordedRenewalStart) {
          renewalStartDate =
            new Date(recordedRenewalStart);
        } else {
          // Legacy fallback for old payments that do not
          // contain "Renewal start" in their notes.

          const now = new Date();

          const currentEndDate =
            membership.endDate
              ? new Date(membership.endDate)
              : null;

          if (
            currentEndDate &&
            currentEndDate > now
          ) {
            renewalStartDate =
              new Date(currentEndDate);
          } else {
            renewalStartDate =
              new Date(now);

            renewalStartDate.setHours(
              0,
              0,
              0,
              0
            );
          }
        }

        if (
          Number.isNaN(
            renewalStartDate.getTime()
          )
        ) {
          throw new Error(
            "Renewal start date is invalid."
          );
        }

        // =====================================================
        // SAFETY CHECK
        //
        // The stored renewal start must make sense relative
        // to the membership.
        //
        // For active memberships, renewal should begin at or
        // after the current end date.
        //
        // For expired memberships, the stored date should not
        // be in the future.
        // =====================================================

        const now = new Date();

        if (
          membership.endDate &&
          new Date(membership.endDate) > now
        ) {
          const currentEndDate =
            new Date(membership.endDate);

          if (
            renewalStartDate.getTime() !==
            currentEndDate.getTime()
          ) {
            throw new Error(
              "Renewal start date does not match the current membership end date."
            );
          }
        } else if (
          renewalStartDate > now
        ) {
          throw new Error(
            "Renewal start date cannot be in the future for an expired membership."
          );
        }

        // =====================================================
        // CALCULATE NEW END DATE
        // =====================================================

        const newEndDate =
          new Date(renewalStartDate);

        newEndDate.setUTCDate(
          newEndDate.getUTCDate() +
            durationInDays
        );

        if (
          newEndDate <=
          renewalStartDate
        ) {
          throw new Error(
            "Calculated renewal end date is invalid."
          );
        }

        // =====================================================
        // UPDATE MEMBERSHIP
        // =====================================================

        membership.plan = plan._id;
        membership.status = "active";
        membership.endDate = newEndDate;
        membership.priceAtPurchase =
          planPrice;

        // =====================================================
        // MARK PAYMENT AS PAID
        // =====================================================

        payment.status = "paid";
        payment.paidAt = new Date();
        payment.recordedBy =
          currentAdmin._id;
        payment.receivedBy =
          currentAdmin._id;
        payment.membership =
          membership._id;

        if (!payment.transactionId) {
          payment.transactionId =
            `CASH-${payment._id.toString()}`;
        }

        // =====================================================
        // SAVE TRANSACTION
        // =====================================================

        await membership.save({
          session: mongoSession,
        });

        await payment.save({
          session: mongoSession,
        });

        // =====================================================
        // RESULT
        // =====================================================

        result = {
          type: "renewal",

          membership: {
            id: membership._id,
            plan: plan.name,
            renewalStartDate,
            newEndDate,
            durationInDays,
            price:
              membership.priceAtPurchase,
            membershipType:
              membership.membershipType,
            secondaryUser:
              membership.secondaryUser || null,
          },

          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status,
            method: payment.method,
            recordedBy:
              currentAdmin._id,
            receivedBy:
              currentAdmin._id,
          },
        };

        return;
      }
    });

    // =========================================================
    // CLOSE SESSION
    // =========================================================

    await mongoSession.endSession();
    mongoSession = null;

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          result?.type === "extension"
            ? "Cash payment confirmed and membership extended successfully."
            : result?.type === "renewal"
              ? "Cash renewal payment confirmed and membership renewed successfully."
              : result?.type === "membership"
                ? "Cash payment confirmed and membership activated successfully."
                : "Cash payment confirmed successfully.",

        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN CASH PAYMENT CONFIRM ERROR:",
      error
    );

    // =========================================================
    // CLOSE SESSION ON ERROR
    // =========================================================

    if (mongoSession) {
      try {
        await mongoSession.endSession();
      } catch (sessionError) {
        console.error(
          "Failed to close MongoDB session:",
          sessionError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to confirm cash payment.",
      },
      { status: 400 }
    );
  }
}