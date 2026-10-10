import crypto from "crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import {
  getClientIp,
  paymentRateLimit,
  rateLimitResponse,
} from "@/lib/rateLimit";

import Payment from "@/models/Payment";

import {
  completePromotionPayment,
} from "@/lib/completePromotionPayment";

import razorpay from "@/lib/razorpay";

export async function POST(request) {
  const mongoSession =
    await mongoose.startSession();

  try {
    // -----------------------------------
    // 1. AUTHENTICATION
    // -----------------------------------

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

    // -----------------------------------
    // 2. RATE LIMIT
    // -----------------------------------

    const ip = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        `razorpay-promotion-verify:${session.user.id}:${ip}`
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // -----------------------------------
    // 3. READ REQUEST
    // -----------------------------------

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
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body || {};

    // -----------------------------------
    // 4. VALIDATE REQUEST
    // -----------------------------------

    if (
      !paymentId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment verification information is incomplete.",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        paymentId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID.",
        },
        { status: 400 }
      );
    }

    if (
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay verification data.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 5. CONNECT DATABASE
    // -----------------------------------

    await connectDB();

    // -----------------------------------
    // 6. FIND PAYMENT
    // -----------------------------------

    const payment =
      await Payment.findById(paymentId);

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------
    // 7. VERIFY OWNERSHIP
    // -----------------------------------

    if (
      !payment.user ||
      payment.user.toString() !==
        session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------
    // 8. VERIFY PAYMENT TYPE
    // -----------------------------------

    if (
      payment.paymentType !==
      "promotion"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This payment is not a promotion payment.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 9. VERIFY PAYMENT METHOD
    // -----------------------------------

   if (!["online", "upi"].includes(payment.method)) {
  return NextResponse.json(
    {
      success: false,
      message: "This payment method is not supported.",
    },
    { status: 400 }
  );
}

    // -----------------------------------
    // 10. VERIFY PROMOTION REFERENCE
    // -----------------------------------

    if (!payment.promotion) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promotion reference is missing from this payment.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 11. VERIFY RAZORPAY ORDER
    // -----------------------------------

    if (
      payment.gatewayOrderId &&
      payment.gatewayOrderId !==
        razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay order does not match our payment.",
        },
        { status: 400 }
      );
    }

    /*
     * Backward compatibility for older
     * promotion payments.
     */
    if (
      !payment.gatewayOrderId &&
      payment.transactionId !==
        razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay order does not match our payment.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 12. IDEMPOTENCY
    // -----------------------------------

    if (payment.status === "paid") {
      return NextResponse.json({
        success: true,

        message:
          "Payment has already been verified.",

        alreadyProcessed: true,

        razorpay: {
          paymentId:
            payment.gatewayPaymentId ||
            razorpayPaymentId,

          orderId:
            payment.gatewayOrderId ||
            razorpayOrderId,
        },
      });
    }

    if (payment.status === "refunded") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Refunded payment cannot be verified.",
        },
        { status: 400 }
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This payment is not eligible for verification.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 13. VERIFY RAZORPAY SIGNATURE
    // -----------------------------------

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeySecret) {
      console.error(
        "RAZORPAY_KEY_SECRET is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment verification is not configured correctly.",
        },
        { status: 500 }
      );
    }

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpayKeySecret
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    if (
      razorpaySignature.length !==
      generatedSignature.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay payment signature.",
        },
        { status: 400 }
      );
    }

    const signatureIsValid =
      crypto.timingSafeEqual(
        Buffer.from(
          generatedSignature,
          "utf8"
        ),
        Buffer.from(
          razorpaySignature,
          "utf8"
        )
      );

    if (!signatureIsValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay payment signature.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 14. FETCH PAYMENT FROM RAZORPAY
    // -----------------------------------

    let razorpayPayment;

    try {
      razorpayPayment =
        await razorpay.payments.fetch(
          razorpayPaymentId
        );
    } catch (razorpayError) {
      console.error(
        "RAZORPAY PAYMENT FETCH ERROR:",
        razorpayError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to verify the Razorpay payment.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 15. VERIFY PAYMENT ID
    // -----------------------------------

    if (
      razorpayPayment.id !==
      razorpayPaymentId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment ID does not match.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 16. VERIFY ORDER ID
    // -----------------------------------

    if (
      razorpayPayment.order_id !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment order does not match.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 17. VERIFY PAYMENT STATUS
    // -----------------------------------

    if (
      razorpayPayment.status !==
      "captured"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Razorpay payment is not captured. Current status: ${razorpayPayment.status}.`,
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 18. VERIFY CURRENCY
    // -----------------------------------

    if (
      razorpayPayment.currency !==
      "INR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment currency is invalid.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 19. VERIFY AMOUNT
    // -----------------------------------

    const expectedAmountInPaise =
      Math.round(
        Number(payment.amount) * 100
      );

    const razorpayAmountInPaise =
      Number(razorpayPayment.amount);

    if (
      !Number.isSafeInteger(
        expectedAmountInPaise
      ) ||
      !Number.isSafeInteger(
        razorpayAmountInPaise
      ) ||
      expectedAmountInPaise !==
        razorpayAmountInPaise
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment amount does not match our payment.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 20. DATABASE TRANSACTION
    // -----------------------------------

    let completionResult = null;

    await mongoSession.withTransaction(
      async () => {
        const paymentInTransaction =
          await Payment.findById(
            paymentId
          ).session(mongoSession);

        if (!paymentInTransaction) {
          throw new Error(
            "Payment not found."
          );
        }

        // ---------------------------------
        // Ownership again
        // ---------------------------------

        if (
          !paymentInTransaction.user ||
          paymentInTransaction.user.toString() !==
            session.user.id
        ) {
          throw new Error(
            "Unauthorized payment."
          );
        }

        // ---------------------------------
        // Payment type again
        // ---------------------------------

        if (
          paymentInTransaction.paymentType !==
          "promotion"
        ) {
          throw new Error(
            "Invalid promotion payment."
          );
        }
        if (!["online", "upi"].includes(paymentInTransaction.method)) {
  throw new Error("Unsupported promotion payment method.");
}

        // ---------------------------------
        // Concurrent verification
        // ---------------------------------

        if (
          paymentInTransaction.status ===
          "paid"
        ) {
          completionResult = {
            alreadyProcessed: true,
            type: "promotion",
          };

          return;
        }

        if (
          paymentInTransaction.status !==
          "pending"
        ) {
          throw new Error(
            "Payment is not pending."
          );
        }

        // ---------------------------------
        // Store Razorpay IDs
        // ---------------------------------

        paymentInTransaction.gatewayOrderId =
          razorpayOrderId;

        paymentInTransaction.gatewayPaymentId =
          razorpayPaymentId;

        /*
         * Keep transactionId as the Razorpay
         * order ID for compatibility with
         * older records.
         */
        paymentInTransaction.transactionId =
          razorpayOrderId;

        paymentInTransaction.status =
          "paid";

        paymentInTransaction.paidAt =
          new Date();

        await paymentInTransaction.save({
          session: mongoSession,
        });

        // ---------------------------------
        // Complete promotion
        // ---------------------------------

        completionResult =
          await completePromotionPayment(
            paymentInTransaction._id,
            mongoSession
          );
      }
    );

    // -----------------------------------
    // 21. NOTIFICATION
    // -----------------------------------

    if (
      !completionResult?.alreadyProcessed
    ) {
      try {
        if (
          completionResult?.type ===
          "membership"
        ) {
          await createNotification({
            user: session.user.id,

            type: "membership",

            title:
              "Membership Activated",

            message:
              "Your membership promotion payment was successful and your membership has been activated.",

            link: "/dashboard",
          });
        }

        if (
          completionResult?.type ===
          "extension"
        ) {
          await createNotification({
            user: session.user.id,

            type: "membership",

            title:
              "Membership Extended",

            message:
              "Your extension promotion payment was successful and your membership has been extended.",

            link: "/dashboard",
          });
        }
      } catch (notificationError) {
        console.error(
          "CREATE PROMOTION NOTIFICATION ERROR:",
          notificationError
        );
      }
    }

    // -----------------------------------
    // 22. RESPONSE
    // -----------------------------------

    return NextResponse.json({
      success: true,

      message:
        completionResult?.alreadyProcessed
          ? "Payment has already been verified."
          : completionResult?.type ===
              "membership"
            ? "Payment verified and membership activated successfully."
            : "Payment verified and membership extended successfully.",

      alreadyProcessed:
        Boolean(
          completionResult?.alreadyProcessed
        ),

      result:
        completionResult,

      razorpay: {
        paymentId:
          razorpayPaymentId,

        orderId:
          razorpayOrderId,
      },
    });
  } catch (error) {
    console.error(
      "RAZORPAY PROMOTION VERIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Payment verification failed.",
      },
      { status: 400 }
    );
  } finally {
    await mongoSession.endSession();
  }
}