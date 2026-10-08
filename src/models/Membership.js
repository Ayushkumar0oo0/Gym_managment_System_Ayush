import mongoose from "mongoose";

const membershipExtensionSchema = new mongoose.Schema(
  {
    daysAdded: {
      type: Number,
      required: true,
      min: 1,
    },

    oldEndDate: {
      type: Date,
      required: true,
    },

    newEndDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    source: {
      type: String,
      enum: ["admin", "promotion"],
      required: true,
    },

    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      default: null,
    },

    /*
     * Payment that caused this extension.
     *
     * This is important for idempotency.
     *
     * The same promotion can be purchased multiple times,
     * so we must identify the exact payment that created
     * a particular extension.
     */
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

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

const membershipSchema = new mongoose.Schema(
  {
    /*
     * Primary member.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * For a couple membership, this can point to the second
     * member when we create/link their account.
     *
     * For individual memberships this stays null.
     */
    secondaryUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },

    membershipType: {
      type: String,
      enum: ["individual", "couple"],
      default: "individual",
      required: true,
    },

    /*
     * Admin-controlled current couple status.
     *
     * individual memberships use their owner's gender.
     * Couple memberships normally use "couple".
     *
     * If a couple later becomes single, admin can change this
     * to "male" or "female".
     */
    coupleStatus: {
      type: String,
      enum: ["couple", "male", "female", null],
      default: null,
    },

    selectedAddOns: {
      type: [selectedAddOnSchema],
      default: [],
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },

    /*
     * Final membership price at purchase time.
     *
     * Never recalculate historical memberships
     * from today's plan price.
     */
    priceAtPurchase: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Membership extension history.
     *
     * Every admin/promotion extension is recorded here.
     */
    extensions: {
      type: [membershipExtensionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

membershipSchema.index({
  user: 1,
  status: 1,
});

membershipSchema.index({
  secondaryUser: 1,
  status: 1,
});

membershipSchema.index({
  endDate: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

const Membership =
  mongoose.models.Membership ||
  mongoose.model(
    "Membership",
    membershipSchema
  );

export default Membership;