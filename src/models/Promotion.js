import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["membership", "extension"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    posterImage: {
      type: String,
      required: true,
      trim: true,
    },

    offerPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      default: null,
    },

    registrationFeeWaived: {
      type: Boolean,
      default: false,
    },

    extensionDays: {
      type: Number,
      default: null,
      min: 1,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Membership promotion:
 * - Requires membershipPlan
 * - extensionDays must be null
 *
 * Extension promotion:
 * - Requires extensionDays
 * - membershipPlan must be null
 * - registrationFeeWaived must be false
 */
promotionSchema.pre("validate", function () {
  if (this.type === "membership") {
    if (!this.membershipPlan) {
      this.invalidate(
        "membershipPlan",
        "Membership promotion requires a membership plan."
      );
    }

    this.extensionDays = null;
  }

  if (this.type === "extension") {
    if (!this.extensionDays || this.extensionDays < 1) {
      this.invalidate(
        "extensionDays",
        "Extension promotion requires valid extension days."
      );
    }

    this.membershipPlan = null;
    this.registrationFeeWaived = false;
  }
});

const Promotion =
  mongoose.models.Promotion ||
  mongoose.model("Promotion", promotionSchema);

export default Promotion;