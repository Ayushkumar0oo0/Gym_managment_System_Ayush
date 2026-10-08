import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Payment from "@/models/Payment";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";

import {
  paymentRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

const respond = (message, status) =>
  NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );

/* =========================================================
   HELPERS
========================================================= */

function extractDurationFromNotes(notes) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const match = notes.match(/Duration:\s*(\d+)\s*days/i);

  if (!match) {
    return null;
  }

  const duration = Number(match[1]);

  if (!Number.isInteger(duration) || duration < 1) {
    return null;
  }

  return duration;
}

function extractRenewalStartFromNotes(notes) {
  if (typeof notes !== "string" || !notes.trim()) {
    return null;
  }

  const match = notes.match(
    /Renewal start:\s*([^\r\n]+)/i
  );

  if (!match) {
    return null;
  }

  const rawDate = match[1].trim();

  if (!rawDate) {
    return null;
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function extractRegistrationFeeFromNotes(notes) {
  if (typeof notes !== "string" || !notes.trim()) {
    return 0;
  }

  const match = notes.match(
    /Registration fee:\s*₹?\s*([\d,]+(?:\.\d+)?)/i
  );

  if (!match) {
    return 0;
  }

  const amount = Number(
    match[1].replace(/,/g, "")
  );

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return amount;
}

/* =========================================================
   POST
========================================================= */

export async function POST(request) {
  let mongoSession = null;

  try {
    // =======================================================
    // 1. AUTHENTICATION
    // =======================================================

    const session = await auth();

    if (!session?.user?.id) {
      return respond("You must be logged in.", 401);
    }

    // =======================================================
    // 2. ROLE
    // =======================================================

    if (session.user.role !== "member") {
      return respond(
        "Only members can verify membership payments.",
        403
      );
    }

    // =======================================================
    // 3. RATE LIMIT
    // =======================================================

    const clientIp = getClientIp(request);

    const identifier = createRateLimitIdentifier(
      "membership-razorpay-verify",
      `${session.user.id}:${clientIp}`
    );

    const limit =
      await paymentRateLimit.limit(identifier);

    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    // =======================================================
    // 4. REQUEST BODY
    // =======================================================

    let body;

    try {
      body = await request.json();
    } catch {
      return respond(
        "Invalid request body.",
        400
      );
    }

    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body || {};

    if (
      typeof paymentId !== "string" ||
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string"
    ) {
      return respond(
        "Invalid payment verification details.",
        400
      );
    }

    const cleanPaymentId =
      paymentId.trim();

    const cleanOrderId =
      razorpayOrderId.trim();

    const cleanGatewayPaymentId =
      razorpayPaymentId.trim();

    const cleanSignature =
      razorpaySignature.trim();

    if (
      !mongoose.isValidObjectId(
        cleanPaymentId
      ) ||
      !cleanOrderId ||
      !cleanGatewayPaymentId ||
      !/^[a-f0-9]{64}$/i.test(
        cleanSignature
      ) ||
      cleanOrderId.length > 100 ||
      cleanGatewayPaymentId.length > 100
    ) {
      return respond(
        "Invalid payment verification details.",
        400
      );
    }

    // =======================================================
    // 5. RAZORPAY CONFIG
    // =======================================================

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return respond(
        "Payment service is not configured.",
        500
      );
    }

    // =======================================================
    // 6. DATABASE
    // =======================================================

    await connectDB();

    // =======================================================
    // 7. LOAD PAYMENT
    // =======================================================

    const payment =
      await Payment.findById(
        cleanPaymentId
      );

    if (!payment) {
      return respond(
        "Payment not found.",
        404
      );
    }

    // =======================================================
    // 8. OWNERSHIP
    // =======================================================

    if (
      !payment.user ||
      String(payment.user) !==
        String(session.user.id)
    ) {
      return respond(
        "You cannot verify this payment.",
        403
      );
    }

    // =======================================================
    // 9. PAYMENT TYPE
    // =======================================================

    if (
      payment.paymentType !==
        "membership" &&
      payment.paymentType !== "renewal"
    ) {
      return respond(
        "This payment type cannot be verified here.",
        400
      );
    }

    const isNewMembership =
      payment.paymentType ===
      "membership";

    const isRenewal =
      payment.paymentType ===
      "renewal";

    // =======================================================
    // 10. PAYMENT METHOD
    // =======================================================

    if (payment.method !== "upi") {
      return respond(
        "This payment is not a UPI payment.",
        400
      );
    }

    // =======================================================
    // 11. ALREADY PAID
    // =======================================================

    if (payment.status === "paid") {
      if (
        payment.gatewayOrderId ===
          cleanOrderId &&
        payment.gatewayPaymentId ===
          cleanGatewayPaymentId &&
        payment.membership
      ) {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          message: isNewMembership
            ? "This membership payment was already completed."
            : "This renewal was already completed.",
          membershipId:
            payment.membership,
        });
      }

      return respond(
        "This payment has already been completed.",
        409
      );
    }

    // =======================================================
    // 12. PAYMENT MUST BE PENDING
    // =======================================================

    if (payment.status !== "pending") {
      return respond(
        "This payment cannot be verified.",
        400
      );
    }

    // =======================================================
    // 13. RAZORPAY ORDER MATCH
    // =======================================================

    if (
      !payment.gatewayOrderId ||
      payment.gatewayOrderId !==
        cleanOrderId
    ) {
      return respond(
        "Razorpay order does not match.",
        400
      );
    }

    // =======================================================
    // 14. RENEWAL-SPECIFIC VALIDATION
    // =======================================================

    if (isRenewal) {
      if (
        !payment.membership ||
        !payment.membershipPlan
      ) {
        return respond(
          "Renewal information is incomplete.",
          400
        );
      }
    }

    // =======================================================
    // 15. SIGNATURE VERIFICATION
    // =======================================================

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret
        )
        .update(
          `${cleanOrderId}|${cleanGatewayPaymentId}`
        )
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "hex"
      );

    const receivedBuffer =
      Buffer.from(
        cleanSignature,
        "hex"
      );

    if (
      expectedBuffer.length !==
        receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      return respond(
        "Invalid Razorpay payment signature.",
        400
      );
    }

    // =======================================================
    // 16. VERIFY PAYMENT DIRECTLY WITH RAZORPAY
    // =======================================================

    const razorpay =
      new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

    let gatewayPayment;

    try {
      gatewayPayment =
        await razorpay.payments.fetch(
          cleanGatewayPaymentId
        );
    } catch (error) {
      console.error(
        "Razorpay lookup failed:",
        error
      );

      return respond(
        "Unable to confirm the payment with Razorpay.",
        502
      );
    }

    // =======================================================
    // 17. INTERNAL PAYMENT AMOUNT
    // =======================================================

    const paymentAmount =
      Number(payment.amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return respond(
        "Invalid payment amount.",
        400
      );
    }

    const amountInPaise =
      Math.round(
        paymentAmount * 100
      );

    if (
      !Number.isSafeInteger(
        amountInPaise
      ) ||
      amountInPaise <= 0
    ) {
      return respond(
        "Invalid payment amount.",
        400
      );
    }

    // =======================================================
    // 18. VERIFY RAZORPAY DETAILS
    // =======================================================

    if (
      gatewayPayment?.id !==
        cleanGatewayPaymentId ||
      gatewayPayment.order_id !==
        cleanOrderId ||
      gatewayPayment.currency !==
        "INR" ||
      Number(gatewayPayment.amount) !==
        amountInPaise
    ) {
      return respond(
        "Razorpay payment details do not match.",
        400
      );
    }

    // =======================================================
    // 19. PAYMENT MUST BE CAPTURED
    // =======================================================

    if (
      gatewayPayment.status !==
      "captured"
    ) {
      return respond(
        "Payment has not been captured yet.",
        409
      );
    }

    // =======================================================
    // 20. TRANSACTION
    // =======================================================

    mongoSession =
      await mongoose.startSession();

    let result;

    await mongoSession.withTransaction(
      async () => {
        // ===================================================
        // RE-FETCH PAYMENT
        // ===================================================

        const currentPayment =
          await Payment.findById(
            cleanPaymentId
          ).session(mongoSession);

        if (!currentPayment) {
          throw new Error(
            "Payment not found."
          );
        }

        // ===================================================
        // OWNERSHIP
        // ===================================================

        if (
          !currentPayment.user ||
          String(
            currentPayment.user
          ) !==
            String(session.user.id)
        ) {
          throw new Error(
            "You cannot verify this payment."
          );
        }

        // ===================================================
        // PAYMENT TYPE
        // ===================================================

        if (
          currentPayment.paymentType !==
            "membership" &&
          currentPayment.paymentType !==
            "renewal"
        ) {
          throw new Error(
            "Invalid membership payment."
          );
        }

        // ===================================================
        // METHOD
        // ===================================================

        if (
          currentPayment.method !==
          "upi"
        ) {
          throw new Error(
            "This payment is not a UPI payment."
          );
        }

        // ===================================================
        // CONCURRENT VERIFICATION
        // ===================================================

        if (
          currentPayment.status ===
          "paid"
        ) {
          if (
            currentPayment.gatewayOrderId ===
              cleanOrderId &&
            currentPayment.gatewayPaymentId ===
              cleanGatewayPaymentId &&
            currentPayment.membership
          ) {
            result = {
              membershipId:
                currentPayment.membership,
              paymentId:
                currentPayment._id,
              amount:
                currentPayment.amount,
              alreadyVerified:
                true,
            };

            return;
          }

          throw new Error(
            "This payment has already been processed."
          );
        }

        if (
          currentPayment.status !==
          "pending"
        ) {
          throw new Error(
            "This payment cannot be verified."
          );
        }

        // ===================================================
        // GATEWAY ORDER CHECK
        // ===================================================

        if (
          currentPayment.gatewayOrderId !==
            cleanOrderId ||
          Math.round(
            Number(
              currentPayment.amount
            ) * 100
          ) !== amountInPaise
        ) {
          throw new Error(
            "Payment details have changed."
          );
        }

        // ===================================================
        // PREVENT PAYMENT REUSE
        // ===================================================

        const duplicate =
          await Payment.findOne({
            _id: {
              $ne:
                currentPayment._id,
            },
            gatewayPaymentId:
              cleanGatewayPaymentId,
          }).session(
            mongoSession
          );

        if (duplicate) {
          throw new Error(
            "This Razorpay payment was already used."
          );
        }

        // ===================================================
        // LOAD USER
        // ===================================================

        const user =
          await User.findById(
            currentPayment.user
          ).session(
            mongoSession
          );

        if (
          !user ||
          !user.isActive ||
          user.role !== "member"
        ) {
          throw new Error(
            "Member account is not active."
          );
        }

        // ===================================================
        // LOAD PLAN
        // ===================================================

        if (
          !currentPayment.membershipPlan
        ) {
          throw new Error(
            isNewMembership
              ? "Membership plan is missing."
              : "Selected renewal plan is unavailable."
          );
        }

        const plan =
          await MembershipPlan.findById(
            currentPayment.membershipPlan
          ).session(
            mongoSession
          );

        if (
          !plan ||
          !plan.isActive
        ) {
          throw new Error(
            isNewMembership
              ? "Selected membership plan is unavailable."
              : "Selected renewal plan is unavailable."
          );
        }

        // ===================================================
        // PLAN ELIGIBILITY
        // ===================================================

        if (
          plan.eligibility !==
            "both" &&
          plan.eligibility !==
            user.gender
        ) {
          throw new Error(
            "Member is not eligible for this plan."
          );
        }

        // ===================================================
        // NEW MEMBERSHIP
        // ===================================================

        if (isNewMembership) {
          // -----------------------------------------------
          // Ensure payment doesn't already have membership
          // -----------------------------------------------

          if (
            currentPayment.membership
          ) {
            const existingMembership =
              await Membership.findById(
                currentPayment.membership
              ).session(
                mongoSession
              );

            if (
              existingMembership
            ) {
              result = {
                membershipId:
                  existingMembership._id,
                planName:
                  plan.name,
                startDate:
                  existingMembership.startDate,
                endDate:
                  existingMembership.endDate,
                durationInDays:
                  plan.durationInDays,
                paymentId:
                  currentPayment._id,
                amount:
                  currentPayment.amount,
                alreadyVerified:
                  true,
              };

              return;
            }
          }

          // -----------------------------------------------
          // Prevent buying another membership while active
          // -----------------------------------------------

          const activeMembership =
            await Membership.findOne({
              user: user._id,
              status: "active",
              endDate: {
                $gt: new Date(),
              },
            }).session(
              mongoSession
            );

          if (activeMembership) {
            throw new Error(
              "You already have an active membership."
            );
          }

          // -----------------------------------------------
          // Historical amount
          // -----------------------------------------------

          const agreedAmount =
            Number(
              currentPayment.amount
            );

          if (
            !Number.isFinite(
              agreedAmount
            ) ||
            agreedAmount <= 0
          ) {
            throw new Error(
              "Invalid membership payment amount."
            );
          }

          // -----------------------------------------------
          // Duration
          // -----------------------------------------------

          const duration =
            Number(
              plan.durationInDays
            );

          if (
            !Number.isInteger(
              duration
            ) ||
            duration < 1
          ) {
            throw new Error(
              "Invalid membership duration."
            );
          }

          // -----------------------------------------------
          // Start date
          // -----------------------------------------------

          const startDate =
            currentPayment.membershipStartDate
              ? new Date(
                  currentPayment.membershipStartDate
                )
              : new Date();

          if (
            Number.isNaN(
              startDate.getTime()
            )
          ) {
            throw new Error(
              "Invalid membership start date."
            );
          }

          // -----------------------------------------------
          // End date
          // -----------------------------------------------

          const endDate =
            new Date(startDate);

          endDate.setUTCDate(
            endDate.getUTCDate() +
              duration
          );

          // -----------------------------------------------
          // CREATE MEMBERSHIP
          // -----------------------------------------------

          const created =
            await Membership.create(
              [
                {
                  user: user._id,

                  membershipType:
                    "individual",

                  plan: plan._id,

                  selectedAddOns: [],

                  startDate,

                  endDate,

                  status: "active",

                  priceAtPurchase:
                    agreedAmount,

                  extensions: [],
                },
              ],
              {
                session:
                  mongoSession,
              }
            );

          const membership =
            created[0];

          // -----------------------------------------------
          // REGISTRATION FEE
          // -----------------------------------------------

          const registrationFee =
            extractRegistrationFeeFromNotes(
              currentPayment.notes
            );

          if (
            registrationFee > 0
          ) {
            user.registrationFeePaid =
              true;

            user.registrationFeePaidAt =
              new Date();

            await user.save({
              session:
                mongoSession,
            });
          }

          // -----------------------------------------------
          // PAYMENT UPDATE
          // -----------------------------------------------

          const now =
            new Date();

          currentPayment.status =
            "paid";

          currentPayment.gatewayPaymentId =
            cleanGatewayPaymentId;

          currentPayment.transactionId =
            cleanGatewayPaymentId;

          currentPayment.paidAt =
            now;

          currentPayment.membership =
            membership._id;

          currentPayment.membershipStartDate =
            startDate;

          currentPayment.receivedBy =
            null;

          currentPayment.recordedBy =
            null;

          await currentPayment.save({
            session:
              mongoSession,
          });

          // -----------------------------------------------
          // RESULT
          // -----------------------------------------------

          result = {
            membershipId:
              membership._id,

            planName:
              plan.name,

            startDate,

            endDate,

            durationInDays:
              duration,

            paymentId:
              currentPayment._id,

            amount:
              currentPayment.amount,

            alreadyVerified:
              false,
          };

          return;
        }

        // ===================================================
        // RENEWAL
        // ===================================================

        if (isRenewal) {
          // -----------------------------------------------
          // MEMBERSHIP
          // -----------------------------------------------

          if (
            !currentPayment.membership
          ) {
            throw new Error(
              "Membership is not eligible for renewal."
            );
          }

          const membership =
            await Membership.findById(
              currentPayment.membership
            ).session(
              mongoSession
            );

          if (!membership) {
            throw new Error(
              "Membership is not eligible for renewal."
            );
          }

          // -----------------------------------------------
          // OWNERSHIP
          // -----------------------------------------------

          const isPrimaryMember =
            membership.user &&
            String(
              membership.user
            ) ===
              String(user._id);

          const isSecondaryMember =
            membership.secondaryUser &&
            String(
              membership.secondaryUser
            ) ===
              String(user._id);

          if (
            !isPrimaryMember &&
            !isSecondaryMember
          ) {
            throw new Error(
              "Membership is not eligible for renewal."
            );
          }

          // -----------------------------------------------
          // COUPLE MEMBERSHIP
          // -----------------------------------------------

          if (
            membership.membershipType ===
              "couple" ||
            membership.secondaryUser
          ) {
            throw new Error(
              "Couple renewals require admin assistance."
            );
          }

          // -----------------------------------------------
          // HISTORICAL PRICE
          // -----------------------------------------------

          const agreedAmount =
            Number(
              currentPayment.amount
            );

          if (
            !Number.isFinite(
              agreedAmount
            ) ||
            agreedAmount <= 0
          ) {
            throw new Error(
              "Invalid renewal payment amount."
            );
          }

          // -----------------------------------------------
          // HISTORICAL DURATION
          // -----------------------------------------------

          let duration =
            extractDurationFromNotes(
              currentPayment.notes
            );

          if (!duration) {
            duration =
              Number(
                plan.durationInDays
              );
          }

          if (
            !Number.isInteger(
              duration
            ) ||
            duration < 1
          ) {
            throw new Error(
              "Invalid renewal duration."
            );
          }

          // -----------------------------------------------
          // DATES
          // -----------------------------------------------

          const now =
            new Date();

          const previousEndDate =
            new Date(
              membership.endDate
            );

          if (
            Number.isNaN(
              previousEndDate.getTime()
            )
          ) {
            throw new Error(
              "Invalid membership end date."
            );
          }

          const wasActive =
            previousEndDate > now;

          const storedRenewalStart =
            extractRenewalStartFromNotes(
              currentPayment.notes
            );

          let renewalBaseDate;

          if (
            storedRenewalStart
          ) {
            renewalBaseDate =
              storedRenewalStart;

            if (wasActive) {
              const difference =
                Math.abs(
                  renewalBaseDate.getTime() -
                    previousEndDate.getTime()
                );

              if (
                difference > 1000
              ) {
                throw new Error(
                  "Renewal start date does not match membership end date."
                );
              }
            } else {
              if (
                renewalBaseDate >
                now
              ) {
                throw new Error(
                  "Renewal start date is invalid."
                );
              }
            }
          } else {
            renewalBaseDate =
              wasActive
                ? previousEndDate
                : now;
          }

          // -----------------------------------------------
          // NEW END DATE
          // -----------------------------------------------

          const newEndDate =
            new Date(
              renewalBaseDate
            );

          newEndDate.setUTCDate(
            newEndDate.getUTCDate() +
              duration
          );

          // -----------------------------------------------
          // UPDATE MEMBERSHIP
          // -----------------------------------------------

          if (!wasActive) {
            membership.startDate =
              renewalBaseDate;
          }

          membership.endDate =
            newEndDate;

          membership.status =
            "active";

          membership.plan =
            plan._id;

          membership.priceAtPurchase =
            agreedAmount;

          await membership.save({
            session:
              mongoSession,
          });

          // -----------------------------------------------
          // UPDATE PAYMENT
          // -----------------------------------------------

          currentPayment.status =
            "paid";

          currentPayment.gatewayPaymentId =
            cleanGatewayPaymentId;

          currentPayment.transactionId =
            cleanGatewayPaymentId;

          currentPayment.paidAt =
            now;

          currentPayment.membership =
            membership._id;

          currentPayment.membershipStartDate =
            renewalBaseDate;

          currentPayment.receivedBy =
            null;

          currentPayment.recordedBy =
            null;

          await currentPayment.save({
            session:
              mongoSession,
          });

          // -----------------------------------------------
          // RESULT
          // -----------------------------------------------

          result = {
            membershipId:
              membership._id,

            planName:
              plan.name,

            previousEndDate,

            newEndDate,

            durationInDays:
              duration,

            paymentId:
              currentPayment._id,

            amount:
              currentPayment.amount,

            alreadyVerified:
              false,
          };
        }
      }
    );

    // =======================================================
    // 21. RESPONSE
    // =======================================================

    if (result?.alreadyVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,

        message: isNewMembership
          ? "This membership payment was already completed."
          : "This renewal was already completed.",

        result,
      });
    }

    return NextResponse.json({
      success: true,

      message: isNewMembership
        ? "Payment verified. Your membership has been activated."
        : "Payment verified. Your membership has been renewed.",

      result,
    });
  } catch (error) {
    console.error(
      "MEMBERSHIP RAZORPAY VERIFICATION ERROR:",
      error
    );

    const knownErrors = [
      "Payment not found.",
      "You cannot verify this payment.",
      "Invalid membership payment.",
      "This payment is not a UPI payment.",
      "This payment has already been processed.",
      "This payment cannot be verified.",
      "Payment details have changed.",
      "This Razorpay payment was already used.",
      "Member account is not active.",
      "Membership plan is missing.",
      "Selected membership plan is unavailable.",
      "Selected renewal plan is unavailable.",
      "Member is not eligible for this plan.",
      "You already have an active membership.",
      "Invalid membership payment amount.",
      "Invalid membership start date.",
      "Invalid membership duration.",
      "Membership is not eligible for renewal.",
      "Couple renewals require admin assistance.",
      "Invalid renewal payment amount.",
      "Invalid renewal duration.",
      "Invalid membership end date.",
      "Renewal start date does not match membership end date.",
      "Renewal start date is invalid.",
    ];

    const message =
      knownErrors.includes(
        error?.message
      )
        ? error.message
        : "Unable to complete membership payment.";

    return respond(
      message,
      knownErrors.includes(
        error?.message
      )
        ? 409
        : 500
    );
  } finally {
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
  }
}