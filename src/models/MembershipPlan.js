import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
     * This is the gender eligibility of the PLAN.
     *
     * both   -> male and female can purchase
     * male   -> only male
     * female -> only female
     */
    eligibility: {
      type: String,
      enum: ["both", "male", "female"],
      default: "both",
      required: true,
    },

    /*
     * Gym is our normal base service.
     *
     * Optional services such as cardio and personal trainer
     * are handled separately through AddOn.
     */
    features: {
      type: [
        {
          type: String,
          enum: ["gym"],
        },
      ],
      default: ["gym"],
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

membershipPlanSchema.index({
  isActive: 1,
  eligibility: 1,
});

const MembershipPlan =
  mongoose.models.MembershipPlan ||
  mongoose.model(
    "MembershipPlan",
    membershipPlanSchema
  );

export default MembershipPlan;