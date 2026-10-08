import mongoose from "mongoose";

const dietProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    age: {
      type: Number,
      required: true,
      min: 14,
      max: 100,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },

    heightCm: {
      type: Number,
      required: true,
      min: 100,
      max: 250,
    },

    currentWeightKg: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
    },

    goal: {
      type: String,
      enum: [
        "weight_gain",
        "muscle_gain",
        "fat_loss",
        "maintenance",
        "general_fitness",
      ],
      required: true,
    },

    dietType: {
      type: String,
      enum: ["vegetarian", "non_vegetarian"],
      required: true,
    },

    // Days on which the member does not eat non-vegetarian food.
    nonVegRestrictedDays: {
      type: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
      default: [],
    },

    workoutDaysPerWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 7,
    },

    // Used to determine which diet phase the member is currently in.
    dietStartDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    currentPhase: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
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

dietProfileSchema.index({
  user: 1,
  isActive: 1,
});

const DietProfile =
  mongoose.models.DietProfile ||
  mongoose.model("DietProfile", dietProfileSchema);

export default DietProfile;