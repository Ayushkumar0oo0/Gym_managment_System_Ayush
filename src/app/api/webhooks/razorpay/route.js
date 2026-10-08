import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import { connectDB } from "@/lib/mongodb";

import Payment from "@/models/Payment";
import User from "@/models/User";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import RazorpayWebhookEvent from "@/models/RazorpayWebhookEvent";

export async function POST(request) {
  let mongoSession = null;

  try {
    // ==========================================
    // 1. WEBHOOK SECRET
    // ==========================================

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (
      !webhookSecret ||
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      console.error(
        "Razorpay webhook configuration is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Webhook is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // 2. READ RAW REQUEST BODY
    // ==========================================
    //
    // IMPORTANT:
    //
    // We MUST verify the signature against the
    // exact raw request body.
    //
    // Do NOT use request.json() before signature
    // verification.
    //
    // ==========================================

    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        {
          success: false,
          message: "Empty webhook body.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 3. READ RAZORPAY SIGNATURE
    // ==========================================

    const razorpaySignature =
      request.headers.get(
        "x-razorpay-signature"
      );

    if (!razorpaySignature) {
      console.warn(
        "Razorpay webhook signature is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Webhook signature is missing.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 4. VERIFY WEBHOOK SIGNATURE
    // ==========================================

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(rawBody)
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpaySignature.trim(),
        "utf8"
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      console.warn(
        "Invalid Razorpay webhook signature."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    const signatureValid =
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!signatureValid) {
      console.warn(
        "Invalid Razorpay webhook signature."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 5. PARSE JSON AFTER SIGNATURE VERIFICATION
    // ==========================================

    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook JSON.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 6. READ EVENT INFORMATION
    // ==========================================

    const eventType =
      typeof payload?.event === "string"
        ? payload.event.trim()
        : "";

    const eventId =
      request.headers.get(
        "x-razorpay-event-id"
      )?.trim() || null;

    if (!eventType) {
      return NextResponse.json(
        {
          success: false,
          message: "Webhook event type is missing.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 7. EVENT ID
    // ==========================================
    //
    // Razorpay sends an event identifier that we
    // use for idempotency.
    //
    // If unavailable, we derive a deterministic
    // fallback from the raw payload.
    //
    // ==========================================

    const safeEventId =
      eventId ||
      crypto
        .createHash("sha256")
        .update(rawBody)
        .digest("hex");

    // ==========================================
    // 8. ONLY HANDLE PAYMENT.CAPTURED
    // ==========================================

    if (eventType !== "payment.captured") {
      console.log(
        "Ignoring Razorpay webhook event:",
        eventType
      );

      return NextResponse.json(
        {
          success: true,
          message: "Event received and ignored.",
        },
        {
          status: 200,
        }
      );
    }

    // ==========================================
    // 9. EXTRACT PAYMENT DATA
    // ==========================================

    const razorpayPayment =
      payload?.payload?.payment?.entity;

    if (!razorpayPayment) {
      console.error(
        "Razorpay payment entity missing from webhook."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment data is missing.",
        },
        {
          status: 400,
        }
      );
    }

    const razorpayPaymentId =
      typeof razorpayPayment.id === "string"
        ? razorpayPayment.id.trim()
        : "";

    const razorpayOrderId =
      typeof razorpayPayment.order_id === "string"
        ? razorpayPayment.order_id.trim()
        : "";

    const razorpayStatus =
      typeof razorpayPayment.status === "string"
        ? razorpayPayment.status.trim()
        : "";

    const razorpayCurrency =
      typeof razorpayPayment.currency === "string"
        ? razorpayPayment.currency.trim()
        : "";

    const razorpayAmount =
      Number(razorpayPayment.amount);

    if (
      !razorpayPaymentId ||
      !razorpayOrderId
    ) {
      console.error(
        "Razorpay payment ID/order ID missing."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment identifiers are missing.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 10. BASIC PAYMENT VALIDATION
    // ==========================================

    if (razorpayStatus !== "captured") {
      console.warn(
        "payment.captured webhook has unexpected status:",
        razorpayStatus
      );

      return NextResponse.json(
        {
          success: true,
          message: "Payment is not captured.",
        },
        {
          status: 200,
        }
      );
    }

    if (razorpayCurrency !== "INR") {
      console.warn(
        "Unexpected Razorpay payment currency:",
        razorpayCurrency
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment currency.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isSafeInteger(
        razorpayAmount
      ) ||
      razorpayAmount <= 0
    ) {
      console.warn(
        "Invalid Razorpay payment amount:",
        razorpayAmount
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment amount.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // 11. DATABASE CONNECTION
    // ==========================================

    await connectDB();

    // ==========================================
    // 12. START TRANSACTION
    // ==========================================

    mongoSession =
      await mongoose.startSession();

    let result = null;

    await mongoSession.withTransaction(
      async () => {
        // ======================================
        // 13. IDEMPOTENCY CHECK
        // ======================================

        const existingEvent =
          await RazorpayWebhookEvent.findOne({
            eventId: safeEventId,
          }).session(mongoSession);

        if (existingEvent) {
          result = {
            duplicate: true,
          };

          return;
        }

        // ======================================
        // 14. FIND INTERNAL PAYMENT
        // ======================================
        //
        // We trust our own database mapping,
        // not a payment/user ID supplied by the
        // browser.
        //
        // ======================================

        const payment =
          await Payment.findOne({
            gatewayOrderId:
              razorpayOrderId,
            gatewayPaymentId:
              razorpayPaymentId,
          }).session(mongoSession);

        // ======================================
        // 15. PAYMENT MAY NOT YET HAVE
        // gatewayPaymentId
        // ======================================
        //
        // Your normal flow stores gatewayPaymentId
        // during /verify.
        //
        // The webhook can arrive before /verify.
        //
        // Therefore fall back to gatewayOrderId.
        //
        // ======================================

        let internalPayment =
          payment;

        if (!internalPayment) {
          internalPayment =
            await Payment.findOne({
              gatewayOrderId:
                razorpayOrderId,
            }).session(mongoSession);
        }

        if (!internalPayment) {
          console.warn(
            "No internal payment found for Razorpay order:",
            razorpayOrderId
          );

          // Store the event so the same event isn't
          // processed repeatedly forever.
          await RazorpayWebhookEvent.create(
            [
              {
                eventId: safeEventId,
                eventType,
                paymentId:
                  razorpayPaymentId,
                orderId:
                  razorpayOrderId,
                processedAt: new Date(),
              },
            ],
            {
              session: mongoSession,
            }
          );

          result = {
            unmatched: true,
          };

          return;
        }

        // ======================================
        // 16. PAYMENT TYPE
        // ======================================

        if (
          internalPayment.paymentType !==
          "membership"
        ) {
          console.warn(
            "Webhook payment is not a membership payment:",
            internalPayment._id
          );

          await RazorpayWebhookEvent.create(
            [
              {
                eventId: safeEventId,
                eventType,
                paymentId:
                  razorpayPaymentId,
                orderId:
                  razorpayOrderId,
                processedAt: new Date(),
              },
            ],
            {
              session: mongoSession,
            }
          );

          result = {
            ignored: true,
          };

          return;
        }

        // ======================================
        // 17. PAYMENT METHOD
        // ======================================

        if (
          internalPayment.method !==
          "upi"
        ) {
          throw new Error(
            "Webhook payment method is invalid."
          );
        }

        // ======================================
        // 18. INTERNAL ORDER CHECK
        // ======================================

        if (
          internalPayment.gatewayOrderId !==
          razorpayOrderId
        ) {
          throw new Error(
            "Razorpay order does not match internal payment."
          );
        }

        // ======================================
        // 19. AMOUNT CHECK
        // ======================================

        const internalAmount =
          Number(
            internalPayment.amount
          );

        if (
          !Number.isFinite(
            internalAmount
          ) ||
          internalAmount <= 0
        ) {
          throw new Error(
            "Internal payment amount is invalid."
          );
        }

        const expectedPaise =
          Math.round(
            internalAmount * 100
          );

        if (
          expectedPaise !==
          razorpayAmount
        ) {
          throw new Error(
            "Webhook payment amount does not match internal payment."
          );
        }

        // ======================================
        // 20. DUPLICATE PAYMENT CHECK
        // ======================================

        if (
          internalPayment.status ===
          "paid"
        ) {
          // The payment was already completed
          // by the /verify endpoint.
          //
          // Record the webhook event and finish.
          await RazorpayWebhookEvent.create(
            [
              {
                eventId: safeEventId,
                eventType,
                paymentId:
                  razorpayPaymentId,
                orderId:
                  razorpayOrderId,
                processedAt: new Date(),
              },
            ],
            {
              session: mongoSession,
            }
          );

          result = {
            alreadyProcessed: true,
          };

          return;
        }

        // ======================================
        // 21. INVALID PAYMENT STATES
        // ======================================

        if (
          internalPayment.status ===
          "refunded"
        ) {
          throw new Error(
            "Refunded payment cannot activate membership."
          );
        }

        if (
          internalPayment.status ===
          "failed"
        ) {
          throw new Error(
            "Failed payment cannot activate membership."
          );
        }

        if (
          internalPayment.status !==
          "pending"
        ) {
          throw new Error(
            "Payment is not pending."
          );
        }

        // ======================================
        // 22. FIND USER
        // ======================================

        const user =
          await User.findById(
            internalPayment.user
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

        // ======================================
        // 23. ACTIVE MEMBERSHIP CHECK
        // ======================================

        const now = new Date();

        const activeMembership =
          await Membership.findOne({
            user: user._id,
            status: "active",
            endDate: {
              $gte: now,
            },
          }).session(mongoSession);

        if (activeMembership) {
          throw new Error(
            "User already has an active membership."
          );
        }

        // ======================================
        // 24. MEMBERSHIP PLAN
        // ======================================

        if (
          !internalPayment.membershipPlan
        ) {
          throw new Error(
            "Membership plan is missing from payment."
          );
        }

        const plan =
          await MembershipPlan.findById(
            internalPayment.membershipPlan
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

        // ======================================
        // 25. PLAN PRICE
        // ======================================

        const planPrice =
          Number(plan.price);

        if (
          !Number.isFinite(
            planPrice
          ) ||
          planPrice < 0
        ) {
          throw new Error(
            "Membership plan has an invalid price."
          );
        }

        // ======================================
        // 26. PLAN DURATION
        // ======================================

        const durationInDays =
          Number(
            plan.durationInDays
          );

        if (
          !Number.isInteger(
            durationInDays
          ) ||
          durationInDays < 1
        ) {
          throw new Error(
            "Membership plan has an invalid duration."
          );
        }

        // ======================================
        // 27. REGISTRATION FEE
        // ======================================

        const paymentNotes =
          internalPayment.notes ||
          "";

        const registrationFeeIncluded =
          paymentNotes.includes(
            "₹500 registration fee"
          );

        const registrationFee =
          registrationFeeIncluded
            ? 500
            : 0;

        // ======================================
        // 28. BUSINESS AMOUNT VALIDATION
        // ======================================

        const expectedAmount =
          planPrice +
          registrationFee;

        if (
          Number(
            internalPayment.amount
          ) !==
          Number(expectedAmount)
        ) {
          throw new Error(
            `Payment amount mismatch. Expected ₹${expectedAmount}, received ₹${internalPayment.amount}.`
          );
        }

        // ======================================
        // 29. MEMBERSHIP START DATE
        // ======================================

        const startDate =
          internalPayment.membershipStartDate
            ? new Date(
                internalPayment.membershipStartDate
              )
            : new Date();

        if (
          Number.isNaN(
            startDate.getTime()
          )
        ) {
          throw new Error(
            "Membership start date is invalid."
          );
        }

        // ======================================
        // 30. PREVENT PAST START DATE
        // ======================================

        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        const normalizedStartDate =
          new Date(startDate);

        normalizedStartDate.setHours(
          0,
          0,
          0,
          0
        );

        if (
          normalizedStartDate <
          today
        ) {
          throw new Error(
            "Membership start date cannot be in the past."
          );
        }

        // ======================================
        // 31. CALCULATE END DATE
        // ======================================

        const endDate =
          new Date(startDate);

        endDate.setDate(
          endDate.getDate() +
            durationInDays
        );

        // ======================================
        // 32. CREATE MEMBERSHIP
        // ======================================

        const createdMemberships =
          await Membership.create(
            [
              {
                user: user._id,
                plan: plan._id,
                startDate,
                endDate,
                status: "active",
                priceAtPurchase:
                  planPrice,
                extensions: [],
              },
            ],
            {
              session:
                mongoSession,
            }
          );

        const membership =
          createdMemberships[0];

        // ======================================
        // 33. UPDATE PAYMENT
        // ======================================

        internalPayment.status =
          "paid";

        internalPayment.gatewayPaymentId =
          razorpayPaymentId;

        internalPayment.transactionId =
          razorpayPaymentId;

        internalPayment.paidAt =
          new Date();

        internalPayment.membership =
          membership._id;

        // ======================================
        // 34. UPI ADMIN ATTRIBUTION
        // ======================================
        //
        // This is an online Razorpay payment.
        //
        // No physical admin received cash.
        //
        // ======================================

        internalPayment.recordedBy =
          null;

        internalPayment.receivedBy =
          null;

        await internalPayment.save({
          session:
            mongoSession,
        });

        // ======================================
        // 35. REGISTRATION FEE
        // ======================================

        if (
          registrationFeeIncluded
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

        // ======================================
        // 36. STORE WEBHOOK EVENT
        // ======================================

        await RazorpayWebhookEvent.create(
          [
            {
              eventId:
                safeEventId,
              eventType,
              paymentId:
                razorpayPaymentId,
              orderId:
                razorpayOrderId,
              processedAt:
                new Date(),
            },
          ],
          {
            session:
              mongoSession,
          }
        );

        // ======================================
        // 37. RESULT
        // ======================================

        result = {
          processed: true,

          membershipId:
            membership._id.toString(),

          paymentId:
            internalPayment._id.toString(),
        };
      }
    );

    // ==========================================
    // 38. CLOSE TRANSACTION
    // ==========================================

    await mongoSession.endSession();
    mongoSession = null;

    // ==========================================
    // 39. SUCCESS RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Webhook received successfully.",
        result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "RAZORPAY WEBHOOK ERROR:",
      error
    );

    // ==========================================
    // 40. CLOSE SESSION ON ERROR
    // ==========================================

    if (mongoSession) {
      try {
        await mongoSession.endSession();
      } catch (sessionError) {
        console.error(
          "Failed to close webhook MongoDB session:",
          sessionError
        );
      }
    }

    // ==========================================
    // 41. SAFE RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: false,
        message:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}