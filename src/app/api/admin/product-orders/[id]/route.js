
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";

import ProductOrder from "@/models/ProductOrder";
import Payment from "@/models/Payment";

export const dynamic = "force-dynamic";

class RouteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function jsonError(message, status) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function calculateAmounts(order) {
  const totalAmount = Number(order.totalAmount);
  const initialPaidAmount = Number(order.initialPaidAmount || 0);
  const finalPaidAmount = Number(order.finalPaidAmount || 0);

  const totalPaid = initialPaidAmount + finalPaidAmount;
  const remainingAmount = Math.max(totalAmount - totalPaid, 0);

  return {
    totalAmount,
    initialPaidAmount,
    finalPaidAmount,
    totalPaid,
    remainingAmount,
  };
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    throw new RouteError("You must be logged in.", 401);
  }

  if (session.user.role !== "admin" || !session.user.id) {
    throw new RouteError("Access denied.", 403);
  }

  return session;
}

// =====================================================
// GET - ADMIN PRODUCT ORDER DETAILS
// =====================================================

export async function GET(request, { params }) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return jsonError("Invalid product order ID.", 400);
    }

    await connectDB();

    const order = await ProductOrder.findById(id)
      .populate("user", "name email phone")
      .populate(
        "product",
        "name description imageUrl originalPrice price"
      )
      .populate("initialPaymentConfirmedBy", "name email")
      .populate("finalPaymentConfirmedBy", "name email")
      .lean();

    if (!order) {
      return jsonError("Product order not found.", 404);
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        ...calculateAmounts(order),
      },
    });
  } catch (error) {
    console.error("ADMIN PRODUCT ORDER GET ERROR:", error);

    return jsonError(
      error.status ? error.message : "Failed to load product order.",
      error.status || 500
    );
  }
}

// =====================================================
// PATCH - ADMIN PRODUCT ORDER ACTIONS
// =====================================================

export async function PATCH(request, { params }) {
  let session;
  let notification = null;
  let result = null;

  try {
    session = await requireAdmin();

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return jsonError("Invalid product order ID.", 400);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON request body.", 400);
    }

    const action = body?.action;

    const allowedActions = [
      "confirm_initial_cash",
      "mark_ordered",
      "mark_ready_for_pickup",
      "confirm_final_cash",
      "mark_delivered",
      "cancel",
    ];

    if (!allowedActions.includes(action)) {
      return jsonError("Invalid product order action.", 400);
    }

    await connectDB();

    const mongoSession = await mongoose.startSession();

    try {
      await mongoSession.withTransaction(async () => {
        notification = null;

        const order = await ProductOrder.findById(id).session(
          mongoSession
        );

        if (!order) {
          throw new RouteError("Product order not found.", 404);
        }

        const now = new Date();

        const {
          totalAmount,
          initialPaidAmount,
          finalPaidAmount,
          totalPaid,
          remainingAmount,
        } = calculateAmounts(order);

        if (
          !Number.isFinite(totalAmount) ||
          totalAmount <= 0 ||
          !Number.isFinite(initialPaidAmount) ||
          !Number.isFinite(finalPaidAmount) ||
          initialPaidAmount < 0 ||
          finalPaidAmount < 0 ||
          totalPaid > totalAmount
        ) {
          throw new RouteError(
            "Product order has invalid payment amounts.",
            409
          );
        }

        // -------------------------------------------------
        // 1. CONFIRM INITIAL CASH PAYMENT
        // -------------------------------------------------

        if (action === "confirm_initial_cash") {
          if (order.orderStatus === "cancelled") {
            throw new RouteError(
              "Cancelled orders cannot receive payments."
            );
          }

          if (order.initialPaymentMethod !== "cash") {
            throw new RouteError(
              "Initial payment method is not cash."
            );
          }

          if (order.initialPaymentStatus === "paid") {
            throw new RouteError(
              "Initial payment is already confirmed."
            );
          }

          if (order.initialPaymentStatus !== "pending") {
            throw new RouteError(
              "Initial payment is not awaiting confirmation."
            );
          }

          if (order.orderStatus !== "pending_payment") {
            throw new RouteError(
              "Initial payment can only be confirmed for an order awaiting payment."
            );
          }

          const initialAmount = Number(order.initialPaymentAmount);

          if (
            !Number.isFinite(initialAmount) ||
            initialAmount <= 0 ||
            initialAmount > totalAmount
          ) {
            throw new RouteError("Invalid initial payment amount.");
          }

          const existingPayment = await Payment.findOne({
            user: order.user,
            productOrder: order._id,
            paymentType: "product",
            method: "cash",
            notes: "Initial product order payment.",
            status: "paid",
          }).session(mongoSession);

          if (existingPayment) {
            throw new RouteError(
              "Initial cash payment has already been recorded."
            );
          }

          await Payment.create(
            [
              {
                user: order.user,
                productOrder: order._id,
                paymentType: "product",
                amount: initialAmount,
                method: "cash",
                status: "paid",
                paidAt: now,
                recordedBy: session.user.id,
                notes: "Initial product order payment.",
              },
            ],
            { session: mongoSession }
          );

          order.initialPaidAmount = initialAmount;
          order.initialPaymentStatus = "paid";
          order.initialPaidAt = now;
          order.initialPaymentConfirmedBy = session.user.id;

          order.remainingAmount = Math.max(
            totalAmount - initialAmount - finalPaidAmount,
            0
          );

          order.paymentStatus =
            order.remainingAmount === 0 ? "paid" : "partially_paid";

          order.orderStatus = "ordered";

          await order.save({ session: mongoSession });

          notification = {
            user: order.user,
            type: "payment",
            title: "Initial Cash Payment Confirmed",
            message: `Your initial cash payment of ₹${initialAmount.toLocaleString(
              "en-IN"
            )} has been confirmed. Your product order has been placed.`,
            productOrder: order._id,
            link: `/orders/${order._id}`,
          };

          result = {
            success: true,
            message: "Initial cash payment confirmed.",
          };

          return;
        }

        // -------------------------------------------------
        // 2. MARK ORDERED
        // -------------------------------------------------

        if (action === "mark_ordered") {
          if (order.orderStatus === "ordered") {
            result = {
              success: true,
              message: "Order is already marked as ordered.",
            };
            return;
          }

          if (order.orderStatus !== "pending_payment") {
            throw new RouteError(
              "Only an order awaiting payment can be marked ordered."
            );
          }

          if (order.initialPaymentStatus !== "paid") {
            throw new RouteError(
              "Initial payment must be paid before ordering the product."
            );
          }

          order.orderStatus = "ordered";
          await order.save({ session: mongoSession });

          result = {
            success: true,
            message: "Product order marked as ordered.",
          };

          return;
        }

        // -------------------------------------------------
        // 3. MARK READY FOR PICKUP
        // -------------------------------------------------

        if (action === "mark_ready_for_pickup") {
          if (order.orderStatus !== "ordered") {
            throw new RouteError(
              "Only ordered products can be marked ready for pickup."
            );
          }

          if (order.initialPaymentStatus !== "paid") {
            throw new RouteError(
              "Initial payment must be paid first."
            );
          }

          order.orderStatus = "ready_for_pickup";
          order.readyForPickupAt = now;

          await order.save({ session: mongoSession });

          notification = {
            user: order.user,
            type: "product_ready",
            title: "Product Ready for Pickup",
            message:
              remainingAmount > 0
                ? `Your product is ready for pickup at the gym. Remaining amount: ₹${remainingAmount.toLocaleString(
                    "en-IN"
                  )}.`
                : "Your product is ready for pickup at the gym.",
            productOrder: order._id,
            link: `/orders/${order._id}`,
          };

          result = {
            success: true,
            message:
              "Product marked as ready for pickup and member notified.",
          };

          return;
        }

        // -------------------------------------------------
        // 4. CONFIRM FINAL CASH PAYMENT
        // -------------------------------------------------

        if (action === "confirm_final_cash") {
          if (order.orderStatus !== "ready_for_pickup") {
            throw new RouteError(
              "Product must be ready for pickup before final payment."
            );
          }

          if (order.initialPaymentStatus !== "paid") {
            throw new RouteError("Initial payment must be paid first.");
          }

          if (order.paymentStatus === "paid") {
            throw new RouteError("Order is already fully paid.");
          }

          if (order.finalPaymentMethod === "upi") {
            throw new RouteError(
              "Final payment method is UPI, not cash."
            );
          }

          if (remainingAmount <= 0) {
            throw new RouteError("There is no remaining amount.");
          }

          const existingPayment = await Payment.findOne({
            user: order.user,
            productOrder: order._id,
            paymentType: "product",
            method: "cash",
            notes: "Final product order payment.",
            status: "paid",
          }).session(mongoSession);

          if (existingPayment) {
            throw new RouteError(
              "Final cash payment has already been recorded."
            );
          }

          await Payment.create(
            [
              {
                user: order.user,
                productOrder: order._id,
                paymentType: "product",
                amount: remainingAmount,
                method: "cash",
                status: "paid",
                paidAt: now,
                recordedBy: session.user.id,
                notes: "Final product order payment.",
              },
            ],
            { session: mongoSession }
          );

          order.finalPaymentMethod = "cash";
          order.finalPaidAmount =
            Number(order.finalPaidAmount || 0) + remainingAmount;
          order.finalPaymentStatus = "paid";
          order.finalPaidAt = now;
          order.finalPaymentConfirmedBy = session.user.id;
          order.remainingAmount = 0;
          order.paymentStatus = "paid";

          await order.save({ session: mongoSession });

          notification = {
            user: order.user,
            type: "payment",
            title: "Final Cash Payment Confirmed",
            message: `Your final cash payment of ₹${remainingAmount.toLocaleString(
              "en-IN"
            )} has been confirmed. Your product order is now fully paid.`,
            productOrder: order._id,
            link: `/orders/${order._id}`,
          };

          result = {
            success: true,
            message: "Final cash payment confirmed.",
          };

          return;
        }

        // -------------------------------------------------
        // 5. MARK DELIVERED
        // -------------------------------------------------

        if (action === "mark_delivered") {
          if (order.paymentStatus !== "paid" || remainingAmount !== 0) {
            throw new RouteError(
              "Full payment is required before delivery."
            );
          }

          if (
            !["ready_for_pickup", "ordered"].includes(
              order.orderStatus
            )
          ) {
            throw new RouteError(
              "Order cannot be marked delivered from its current status."
            );
          }

          order.orderStatus = "delivered";
          order.deliveredAt = now;

          await order.save({ session: mongoSession });

          result = {
            success: true,
            message: "Product order marked as delivered.",
          };

          return;
        }

        // -------------------------------------------------
        // 6. CANCEL ORDER
        // -------------------------------------------------

        if (action === "cancel") {
          if (
            order.orderStatus === "delivered" ||
            order.orderStatus === "cancelled"
          ) {
            throw new RouteError(
              "This order cannot be cancelled in its current status."
            );
          }

          if (totalPaid > 0 || order.paymentStatus === "paid") {
            throw new RouteError(
              "This order has recorded payments. Resolve the refund before cancelling it."
            );
          }

          order.orderStatus = "cancelled";
          await order.save({ session: mongoSession });

          result = {
            success: true,
            message: "Product order cancelled.",
          };
        }
      });
    } finally {
      await mongoSession.endSession();
    }

    // Send notifications only after the database transaction commits.
    if (notification) {
      try {
        await createNotification(notification);
      } catch (notificationError) {
        console.error(
          "PRODUCT ORDER NOTIFICATION ERROR:",
          notificationError
        );
      }
    }

    return NextResponse.json(result || {
      success: true,
      message: "Product order updated.",
    });
  } catch (error) {
    console.error("ADMIN PRODUCT ORDER PATCH ERROR:", error);

    return jsonError(
      error.status ? error.message : "Failed to update product order.",
      error.status || 500
    );
  }
}
