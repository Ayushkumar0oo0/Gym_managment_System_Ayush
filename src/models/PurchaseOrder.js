import mongoose from "mongoose";

const selectedAddOnSchema = new mongoose.Schema(
  {
    addOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AddOn",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    priceAtPurchase: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    // ==================================================
    // ORDER INFORMATION
    // ==================================================

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // ==================================================
    // PRIMARY CUSTOMER INFORMATION
    // ==================================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{10}$/,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },

    /*
     * Temporary password hash used while the
     * purchase order is waiting for payment.
     *
     * It is removed after successful completion.
     */
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // ==================================================
    // EMERGENCY CONTACT
    // ==================================================

    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      maxlength: 10,
      default: "",
    },

    emergencyContactRelation: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    // ==================================================
    // MEMBERSHIP PLAN
    // ==================================================

    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },

    /*
     * IMPORTANT:
     *
     * This is a snapshot of the membership duration
     * at the exact time the customer creates the order.
     *
     * Example:
     *
     * Customer purchases a 180-day plan.
     * Later admin changes that plan to 150 days.
     *
     * The existing purchase must still give
     * the customer 180 days.
     */
    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },

    membershipType: {
      type: String,
      enum: ["individual", "couple"],
      required: true,
      default: "individual",
    },

    // ==================================================
    // COUPLE PARTNER
    // ==================================================

    partner: {
      name: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      email: {
        type: String,
        lowercase: true,
        trim: true,
        maxlength: 150,
        default: "",
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 10,
        default: "",
      },

      gender: {
        type: String,
        enum: ["male", "female", null],
        default: null,
      },
    },

    // ==================================================
    // SELECTED ADD-ONS
    // ==================================================

    selectedAddOns: {
      type: [selectedAddOnSchema],
      default: [],
    },

    // ==================================================
    // PROMOTION
    // ==================================================

    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      default: null,
    },

    // ==================================================
    // PRICE SNAPSHOTS
    // ==================================================

    /*
     * Membership price after promotion/discount.
     */
    membershipPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Total price of selected add-ons.
     */
    addOnsTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /*
     * Registration fee after promotion.
     *
     * Normally ₹500.
     * Can be 0 when a valid promotion waives it.
     */
    registrationFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /*
     * Discount applied to membership price.
     */
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /*
     * Final amount customer needs to pay.
     */
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==================================================
    // PAYMENT
    // ==================================================

    paymentMethod: {
  type: String,
  enum: ["online", "upi", "cash"],
  required: true,
},

    // ==================================================
    // ORDER STATUS
    // ==================================================

    status: {
      type: String,
      enum: [
        "pending",
        "payment_pending",
        "cash_pending",
        "paid",
        "completed",
        "cancelled",
        "expired",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    // ==================================================
    // RAZORPAY INFORMATION
    // ==================================================

    gatewayOrderId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    gatewayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================================================
    // CREATED ACCOUNT / MEMBERSHIP / PAYMENT
    // ==================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // ==================================================
    // ADMIN CONFIRMATION
    // ==================================================

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // EXPIRATION
    // ==================================================

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ==================================================
    // NOTES
    // ==================================================

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ==================================================
// INDEXES
// ==================================================

purchaseOrderSchema.index({
  phone: 1,
  createdAt: -1,
});

purchaseOrderSchema.index({
  email: 1,
  createdAt: -1,
});

purchaseOrderSchema.index({
  status: 1,
  createdAt: -1,
});

// ==================================================
// MODEL
// ==================================================

const PurchaseOrder =
  mongoose.models.PurchaseOrder ||
  mongoose.model(
    "PurchaseOrder",
    purchaseOrderSchema
  );

export default PurchaseOrder;