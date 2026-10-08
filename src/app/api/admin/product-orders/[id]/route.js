import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";

import User from "@/models/User";
import ProductOrder from "@/models/ProductOrder";
import Payment from "@/models/Payment";

// =====================================================
// GET - ADMIN PRODUCT ORDER
// =====================================================

export async function GET(request, { params }) {
  try {
    // --------------------------------
    // Authentication
    // --------------------------------

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

    // --------------------------------
    // Admin only
    // --------------------------------

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // --------------------------------
    // Find order
    // --------------------------------

    const order = await ProductOrder.findById(id)
      .populate(
        "user",
        "name email phone"
      )
      .populate(
        "product",
        "name description imageUrl originalPrice price"
      )
      .populate(
        "initialPaymentConfirmedBy",
        "name email"
      )
      .populate(
        "finalPaymentConfirmedBy",
        "name email"
      )
      .lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------
    // Calculate payment
    // --------------------------------

    const totalAmount =
      Number(order.totalAmount) || 0;

    const initialPaidAmount =
      Number(order.initialPaidAmount) || 0;

    const finalPaidAmount =
      Number(order.finalPaidAmount) || 0;

    const totalPaid =
      initialPaidAmount + finalPaidAmount;

    const remainingAmount = Math.max(
      totalAmount - totalPaid,
      0
    );

    return NextResponse.json(
      {
        success: true,

        order: {
          ...order,
          totalPaid,
          remainingAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCT ORDER GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load product order.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH - ADMIN PRODUCT ORDER ACTIONS
// =====================================================

export async function PATCH(request, { params }) {
  try {
    // --------------------------------
    // Authentication
    // --------------------------------

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

    // --------------------------------
    // Admin only
    // --------------------------------

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Read request
    // --------------------------------

    const body = await request.json();

    const action = body?.action;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Action is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // --------------------------------
    // Find order
    // --------------------------------

    const order =
      await ProductOrder.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // =================================================
    // 1. CONFIRM INITIAL CASH PAYMENT
    // =================================================

    if (action === "confirm_initial_cash") {
      if (
        order.initialPaymentMethod !== "cash"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Initial payment method is not cash.",
          },
          { status: 400 }
        );
      }

      if (
        order.initialPaymentStatus === "paid"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Initial payment is already confirmed.",
          },
          { status: 400 }
        );
      }

      if (
        order.orderStatus === "cancelled"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Cancelled orders cannot receive payments.",
          },
          { status: 400 }
        );
      }

      const initialAmount =
        Number(order.initialPaymentAmount) || 0;

      if (initialAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid initial payment amount.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Prevent duplicate cash payment
      // --------------------------------

      const existingPayment =
        await Payment.findOne({
          user: order.user,
          productOrder: order._id,
          paymentType: "product",
          method: "cash",
          notes: "Initial product order payment.",
          status: "paid",
        });

      if (existingPayment) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Initial cash payment has already been recorded.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Create Payment record
      // --------------------------------

      await Payment.create({
        user: order.user,
        productOrder: order._id,
        paymentType: "product",
        amount: initialAmount,
        method: "cash",
        status: "paid",
        paidAt: new Date(),
        recordedBy: session.user.id,
        notes: "Initial product order payment.",
      });

      // --------------------------------
      // Update order
      // --------------------------------

      order.initialPaidAmount = initialAmount;

      order.initialPaymentStatus = "paid";

      order.initialPaidAt = new Date();

      order.initialPaymentConfirmedBy =
        session.user.id;

      order.remainingAmount = Math.max(
        Number(order.totalAmount) -
          initialAmount -
          Number(order.finalPaidAmount || 0),
        0
      );

      if (order.remainingAmount === 0) {
        order.paymentStatus = "paid";
      } else {
        order.paymentStatus = "partially_paid";
      }

      order.orderStatus = "ordered";

      await order.save();

      // --------------------------------
      // Create payment notification
      // --------------------------------

      try {
        await createNotification({
          user: order.user,

          type: "payment",

          title: "Initial Cash Payment Confirmed",

          message: `Your initial cash payment of ₹${initialAmount.toLocaleString(
            "en-IN"
          )} has been confirmed by the gym. Your product order has been placed.`,

          productOrder: order._id,

          link: `/orders/${order._id}`,
        });
      } catch (notificationError) {
        console.error(
          "CREATE INITIAL CASH PAYMENT NOTIFICATION ERROR:",
          notificationError
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Initial cash payment confirmed.",
        },
        { status: 200 }
      );
    }

    // =================================================
    // 2. MARK ORDERED
    // =================================================

    if (action === "mark_ordered") {
      if (
        order.initialPaymentStatus !== "paid"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Initial payment must be paid before ordering the product.",
          },
          { status: 400 }
        );
      }

      if (order.orderStatus !== "ordered") {
        return NextResponse.json(
          {
            success: true,
            message:
              "Order is already marked as ordered.",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Order is already marked as ordered.",
        },
        { status: 200 }
      );
    }

    // =================================================
    // 3. MARK READY FOR PICKUP
    // =================================================

    if (
      action === "mark_ready_for_pickup"
    ) {
      // --------------------------------
      // Validate payment
      // --------------------------------

      if (
        order.initialPaymentStatus !== "paid"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Initial payment must be paid first.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Validate status
      // --------------------------------

      if (
        order.orderStatus !== "ordered"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only ordered products can be marked ready for pickup.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Mark ready
      // --------------------------------

      order.orderStatus =
        "ready_for_pickup";

      order.readyForPickupAt =
        new Date();

      await order.save();

      // --------------------------------
      // Calculate remaining amount
      // --------------------------------

      const remainingAmount =
        Math.max(
          Number(order.totalAmount) -
            Number(
              order.initialPaidAmount || 0
            ) -
            Number(
              order.finalPaidAmount || 0
            ),
          0
        );

      // --------------------------------
      // Product name
      // --------------------------------

      let productName = "your product";

      try {
        const populatedOrder =
          await ProductOrder.findById(
            order._id
          )
            .populate("product", "name")
            .lean();

        if (
          populatedOrder?.product?.name
        ) {
          productName =
            populatedOrder.product.name;
        }
      } catch (productError) {
        console.error(
          "PRODUCT NAME LOAD ERROR:",
          productError
        );
      }

      // --------------------------------
      // Create notification
      // --------------------------------

      try {
        await createNotification({
          user: order.user,

          type: "product_ready",

          title:
            "Product Ready for Pickup",

          message:
            remainingAmount > 0
              ? `Your ${productName} is ready for pickup at the gym. Remaining amount: ₹${remainingAmount.toLocaleString(
                  "en-IN"
                )}.`
              : `Your ${productName} is ready for pickup at the gym.`,

          productOrder: order._id,

          link: `/orders/${order._id}`,
        });
      } catch (notificationError) {
        console.error(
          "CREATE PRODUCT READY NOTIFICATION ERROR:",
          notificationError
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Product marked as ready for pickup and member notified.",
        },
        { status: 200 }
      );
    }

    // =================================================
    // 4. CONFIRM FINAL CASH PAYMENT
    // =================================================

    if (
      action === "confirm_final_cash"
    ) {
      // --------------------------------
      // Validate status
      // --------------------------------

      if (
        order.orderStatus !==
        "ready_for_pickup"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product must be ready for pickup before final payment.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Check already paid
      // --------------------------------

      if (
        order.paymentStatus === "paid"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Order is already fully paid.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Calculate remaining amount
      // --------------------------------

      const remainingAmount =
        Math.max(
          Number(order.totalAmount) -
            Number(
              order.initialPaidAmount || 0
            ) -
            Number(
              order.finalPaidAmount || 0
            ),
          0
        );

      if (remainingAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "There is no remaining amount.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Final payment must be cash
      // --------------------------------

      if (
        order.finalPaymentMethod &&
        order.finalPaymentMethod !== "cash"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Final payment method is not cash.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Prevent duplicate final cash
      // --------------------------------

      const existingPayment =
        await Payment.findOne({
          user: order.user,
          productOrder: order._id,
          paymentType: "product",
          method: "cash",
          notes: "Final product order payment.",
          status: "paid",
        });

      if (existingPayment) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Final cash payment has already been recorded.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Create Payment record
      // --------------------------------

      await Payment.create({
        user: order.user,
        productOrder: order._id,
        paymentType: "product",
        amount: remainingAmount,
        method: "cash",
        status: "paid",
        paidAt: new Date(),
        recordedBy: session.user.id,
        notes: "Final product order payment.",
      });

      // --------------------------------
      // Update order
      // --------------------------------

      order.finalPaymentMethod = "cash";

      order.finalPaidAmount =
        Number(order.finalPaidAmount || 0) +
        remainingAmount;

      order.finalPaymentStatus = "paid";

      order.finalPaidAt = new Date();

      order.finalPaymentConfirmedBy =
        session.user.id;

      order.remainingAmount = 0;

      order.paymentStatus = "paid";

      await order.save();

      // --------------------------------
      // Create payment notification
      // --------------------------------

      try {
        await createNotification({
          user: order.user,

          type: "payment",

          title: "Final Cash Payment Confirmed",

          message: `Your final cash payment of ₹${remainingAmount.toLocaleString(
            "en-IN"
          )} has been confirmed by the gym. Your product order is now fully paid.`,

          productOrder: order._id,

          link: `/orders/${order._id}`,
        });
      } catch (notificationError) {
        console.error(
          "CREATE FINAL CASH PAYMENT NOTIFICATION ERROR:",
          notificationError
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Final cash payment confirmed.",
        },
        { status: 200 }
      );
    }

    // =================================================
    // 5. MARK DELIVERED
    // =================================================

    if (action === "mark_delivered") {
      // --------------------------------
      // Full payment required
      // --------------------------------

      if (
        order.paymentStatus !== "paid"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Full payment is required before delivery.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Validate status
      // --------------------------------

      if (
        order.orderStatus !==
          "ready_for_pickup" &&
        order.orderStatus !== "ordered"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Order cannot be marked as delivered from its current state.",
          },
          { status: 400 }
        );
      }

      order.orderStatus = "delivered";

      order.deliveredAt = new Date();

      await order.save();

      return NextResponse.json(
        {
          success: true,
          message:
            "Product order marked as delivered.",
        },
        { status: 200 }
      );
    }

    // =================================================
    // 6. CANCEL ORDER
    // =================================================

    if (action === "cancel") {
      // --------------------------------
      // Delivered cannot be cancelled
      // --------------------------------

      if (
        order.orderStatus === "delivered"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Delivered orders cannot be cancelled.",
          },
          { status: 400 }
        );
      }

      // --------------------------------
      // Fully paid needs refund handling
      // --------------------------------

      if (
        order.paymentStatus === "paid"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Fully paid orders require refund handling before cancellation.",
          },
          { status: 400 }
        );
      }

      order.orderStatus = "cancelled";

      await order.save();

      return NextResponse.json(
        {
          success: true,
          message:
            "Product order cancelled.",
        },
        { status: 200 }
      );
    }

    // =================================================
    // UNKNOWN ACTION
    // =================================================

    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid product order action.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCT ORDER PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update product order.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}