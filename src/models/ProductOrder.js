
import mongoose from "mongoose";

const productOrderSchema = new mongoose.Schema(
  {
    // Member who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Product being ordered
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Quantity ordered
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Product price at the time of ordering
    priceAtOrder: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total = priceAtOrder × quantity
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Percentage member chose to pay initially
    initialPaymentPercentage: {
      type: Number,
      required: true,
      min: 30,
      max: 100,
      enum: [30, 40, 50, 60, 70, 80, 90, 100],
    },

    // Amount expected as initial payment
    initialPaymentAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Amount actually confirmed as paid initially
    initialPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Initial payment method
    initialPaymentMethod: {
      type: String,
      enum: ["cash", "online", "upi"],
      default: null,
    },

    // Whether initial payment has been confirmed
    initialPaymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // Remaining amount after initial payment
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Final payment method
    finalPaymentMethod: {
      type: String,
      enum: ["cash", "online", "upi"],
      default: null,
    },

    // Amount paid at final collection
    finalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final payment status
    finalPaymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    // Overall payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "partially_paid", "paid"],
      default: "pending",
      index: true,
    },

    // Product/order progress
    orderStatus: {
      type: String,
      enum: [
        "pending_payment",
        "ordered",
        "ready_for_pickup",
        "delivered",
        "cancelled",
      ],
      default: "pending_payment",
      index: true,
    },

    // Optional notes from member
    memberNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Admin notes
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Admin who confirmed initial cash payment
    initialPaymentConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Razorpay order and payment IDs
    gatewayOrderId: {
      type: String,
      trim: true,
      default: null,
    },

    gatewayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },

    // Admin who confirmed final cash payment
    finalPaymentConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // When initial payment was confirmed
    initialPaidAt: {
      type: Date,
      default: null,
    },

    // When final payment was completed
    finalPaidAt: {
      type: Date,
      default: null,
    },

    // When product became ready
    readyForPickupAt: {
      type: Date,
      default: null,
    },

    // When product was delivered
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ProductOrder =
  mongoose.models.ProductOrder ||
  mongoose.model("ProductOrder", productOrderSchema);

export default ProductOrder;
