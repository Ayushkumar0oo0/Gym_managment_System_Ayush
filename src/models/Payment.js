import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // =========================
    // USER
    // =========================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================
    // MEMBERSHIP
    // =========================
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },

    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      default: null,
    },

    membershipStartDate: {
      type: Date,
      default: null,
    },

    // =========================
    // PROMOTION
    // =========================
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      default: null,
    },

    // =========================
    // PAYMENT TYPE
    // =========================
    paymentType: {
      type: String,
      enum: [
        "registration",
        "membership",
        "renewal",
        "promotion",
        "product",
        "other",
      ],
      required: true,
    },

    // =========================
    // AMOUNT
    // =========================
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // PAYMENT METHOD
    // =========================
    method: {
  type: String,
  enum: ["online", "upi", "cash"],
  required: true,
  default: "cash",
},

    // =========================
    // PAYMENT STATUS
    // =========================
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // =========================
    // RAZORPAY
    // =========================
    gatewayOrderId: {
      type: String,
      default: null,
      trim: true,
    },

    gatewayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },

    // =========================
    // TRANSACTION ID
    // =========================
    transactionId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },

    // =========================
    // PAYMENT DATE
    // =========================
    paidAt: {
      type: Date,
      default: null,
    },

    // =========================
    // ADMIN WHO RECORDED PAYMENT
    // =========================
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =========================
    // ADMIN WHO RECEIVED MONEY
    // =========================
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =========================
    // PRODUCT ORDER
    // =========================
    productOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductOrder",
      default: null,
    },

    // =========================
    // NOTES
    // =========================
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// INDEXES
// =========================

// Quickly find all payments of a user
paymentSchema.index({
  user: 1,
  createdAt: -1,
});

// Useful for revenue calculations
paymentSchema.index({
  status: 1,
  paidAt: -1,
});

// Useful for payment history by type
paymentSchema.index({
  paymentType: 1,
  status: 1,
});

// Useful for admin revenue/activity
paymentSchema.index({
  receivedBy: 1,
  status: 1,
  paidAt: -1,
});

// Useful for payments recorded by an admin
paymentSchema.index({
  recordedBy: 1,
  status: 1,
  paidAt: -1,
});

// =========================
// RAZORPAY SAFETY INDEXES
// =========================

// Prevent the same Razorpay payment
// from being stored more than once
paymentSchema.index(
  { gatewayPaymentId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// Prevent the same Razorpay order
// from being attached to multiple payments
paymentSchema.index(
  { gatewayOrderId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// =========================
// MODEL
// =========================

const Payment =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);

export default Payment;