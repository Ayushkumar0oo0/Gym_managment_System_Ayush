import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import PurchaseOrder from "@/models/PurchaseOrder";

import {
  paymentRateLimit,
  getClientIp,
  createRateLimitIdentifier,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(request) {
  try {
    // --------------------------------------------------
    // 1. Rate limiting
    // --------------------------------------------------

    const clientIp = getClientIp(request);

    const rateLimitResult =
      await paymentRateLimit.limit(
        createRateLimitIdentifier(
          "public-purchase-razorpay",
          clientIp
        )
      );

    if (!rateLimitResult.success) {
      return rateLimitResponse(
        rateLimitResult
      );
    }

    // --------------------------------------------------
    // 2. Read request body
    // --------------------------------------------------

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

    const { purchaseOrderId } = body;

    if (!purchaseOrderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase order ID is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Validate MongoDB ObjectId
    // --------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        purchaseOrderId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid purchase order ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Check Razorpay configuration
    // --------------------------------------------------

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      console.error(
        "PUBLIC PURCHASE RAZORPAY ERROR: Razorpay environment variables are missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 5. Connect database
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 6. Find purchase order
    // --------------------------------------------------

    const purchaseOrder =
      await PurchaseOrder.findById(
        purchaseOrderId
      ).select(
        "_id orderNumber name email phone membershipPlan membershipType selectedAddOns promotion membershipPrice addOnsTotal registrationFee discount totalAmount paymentMethod status gatewayOrderId expiresAt"
      );

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase order not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 7. Payment method must be UPI
    // --------------------------------------------------

    if (
      purchaseOrder.paymentMethod !==
      "upi"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This purchase order is not configured for UPI payment.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. Order must still be waiting for payment
    // --------------------------------------------------

    if (
      purchaseOrder.status !==
      "payment_pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `This purchase order cannot accept payment because its current status is "${purchaseOrder.status}".`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Check expiration
    // --------------------------------------------------

    if (
      purchaseOrder.expiresAt &&
      new Date(
        purchaseOrder.expiresAt
      ).getTime() <= Date.now()
    ) {
      await PurchaseOrder.findOneAndUpdate(
        {
          _id: purchaseOrder._id,
          status: "payment_pending",
        },
        {
          $set: {
            status: "expired",
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "This purchase order has expired. Please start again.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 10. Recalculate total from SERVER values
    // --------------------------------------------------

    const membershipPrice =
      Number(
        purchaseOrder.membershipPrice || 0
      );

    const addOnsTotal =
      Number(
        purchaseOrder.addOnsTotal || 0
      );

    const registrationFee =
      Number(
        purchaseOrder.registrationFee || 0
      );

    const storedTotal =
      Number(
        purchaseOrder.totalAmount
      );

    const calculatedTotal =
      membershipPrice +
      addOnsTotal +
      registrationFee;

    // --------------------------------------------------
    // 11. Validate calculated amount
    // --------------------------------------------------

    if (
      !Number.isFinite(
        membershipPrice
      ) ||
      !Number.isFinite(
        addOnsTotal
      ) ||
      !Number.isFinite(
        registrationFee
      ) ||
      !Number.isFinite(
        calculatedTotal
      ) ||
      !Number.isFinite(
        storedTotal
      ) ||
      membershipPrice < 0 ||
      addOnsTotal < 0 ||
      registrationFee < 0 ||
      storedTotal < 0
    ) {
      console.error(
        "PUBLIC PURCHASE RAZORPAY ERROR: Invalid purchase amount.",
        {
          purchaseOrderId:
            purchaseOrder._id.toString(),
          membershipPrice,
          addOnsTotal,
          registrationFee,
          calculatedTotal,
          storedTotal,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid purchase amount.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 12. Verify stored total
    // --------------------------------------------------

    if (
      Math.round(
        calculatedTotal * 100
      ) !==
      Math.round(
        storedTotal * 100
      )
    ) {
      console.error(
        "PUBLIC PURCHASE RAZORPAY ERROR: Purchase total mismatch.",
        {
          purchaseOrderId:
            purchaseOrder._id.toString(),
          calculatedTotal,
          storedTotal,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase amount could not be verified.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 13. Convert INR to paise
    // --------------------------------------------------

    const totalAmount =
      storedTotal;

    const razorpayAmount =
      Math.round(
        totalAmount * 100
      );

    if (
      !Number.isInteger(
        razorpayAmount
      ) ||
      razorpayAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payment amount.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 14. Reuse existing Razorpay order
    // --------------------------------------------------

    if (
      purchaseOrder.gatewayOrderId
    ) {
      return NextResponse.json(
        {
          success: true,

          razorpay: {
            orderId:
              purchaseOrder.gatewayOrderId,

            amount:
              razorpayAmount,

            currency: "INR",

            key:
              razorpayKeyId,
          },

          purchaseOrder: {
            id:
              purchaseOrder._id.toString(),

            orderNumber:
              purchaseOrder.orderNumber,

            amount:
              totalAmount,

            status:
              purchaseOrder.status,
          },
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------
    // 15. Create Razorpay client
    // --------------------------------------------------

    const razorpay =
      new Razorpay({
        key_id:
          razorpayKeyId,

        key_secret:
          razorpayKeySecret,
      });

    // --------------------------------------------------
    // 16. Create Razorpay order
    // --------------------------------------------------

    const razorpayOrder =
      await razorpay.orders.create({
        amount:
          razorpayAmount,

        currency: "INR",

        receipt:
          `purchase_${purchaseOrder._id.toString()}`,

        notes: {
          purchaseOrderId:
            purchaseOrder._id.toString(),

          orderNumber:
            purchaseOrder.orderNumber,

          paymentType:
            "membership",
        },
      });

    // --------------------------------------------------
    // 17. Validate Razorpay response
    // --------------------------------------------------

    if (
      !razorpayOrder ||
      !razorpayOrder.id ||
      razorpayOrder.currency !==
        "INR" ||
      Number(
        razorpayOrder.amount
      ) !== razorpayAmount
    ) {
      console.error(
        "PUBLIC PURCHASE RAZORPAY ERROR: Invalid Razorpay order response.",
        razorpayOrder
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to initialize payment.",
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------
    // 18. Save Razorpay order ID
    // --------------------------------------------------

    const updatedPurchaseOrder =
      await PurchaseOrder.findOneAndUpdate(
        {
          _id:
            purchaseOrder._id,

          status:
            "payment_pending",

          gatewayOrderId:
            null,
        },
        {
          $set: {
            gatewayOrderId:
              razorpayOrder.id,
          },
        },
        {
          new: true,
        }
      );

    // --------------------------------------------------
    // 19. Handle concurrent requests
    // --------------------------------------------------

    if (!updatedPurchaseOrder) {
      const latestPurchaseOrder =
        await PurchaseOrder.findById(
          purchaseOrder._id
        ).select(
          "_id orderNumber totalAmount status gatewayOrderId expiresAt"
        );

      if (
        latestPurchaseOrder &&
        latestPurchaseOrder.status ===
          "payment_pending" &&
        latestPurchaseOrder.gatewayOrderId
      ) {
        const latestAmount =
          Number(
            latestPurchaseOrder.totalAmount
          );

        return NextResponse.json(
          {
            success: true,

            razorpay: {
              orderId:
                latestPurchaseOrder.gatewayOrderId,

              amount:
                Math.round(
                  latestAmount * 100
                ),

              currency: "INR",

              key:
                razorpayKeyId,
            },

            purchaseOrder: {
              id:
                latestPurchaseOrder._id.toString(),

              orderNumber:
                latestPurchaseOrder.orderNumber,

              amount:
                latestAmount,

              status:
                latestPurchaseOrder.status,
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase order changed while starting payment.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 20. Final response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        razorpay: {
          orderId:
            razorpayOrder.id,

          amount:
            razorpayAmount,

          currency: "INR",

          key:
            razorpayKeyId,
        },

        purchaseOrder: {
          id:
            updatedPurchaseOrder._id.toString(),

          orderNumber:
            updatedPurchaseOrder.orderNumber,

          amount:
            totalAmount,

          status:
            updatedPurchaseOrder.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUBLIC PURCHASE RAZORPAY ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to start payment.",
      },
      { status: 500 }
    );
  }
}