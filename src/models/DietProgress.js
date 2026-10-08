import mongoose from "mongoose";

const dietProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    dietProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DietProfile",
      required: true,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    weightKg: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
    },

    // Optional measurements. Members don't have to provide these.
    waistCm: {
      type: Number,
      min: 30,
      max: 250,
      default: null,
    },

    chestCm: {
      type: Number,
      min: 30,
      max: 250,
      default: null,
    },

    armCm: {
      type: Number,
      min: 10,
      max: 100,
      default: null,
    },

    workoutDaysPerWeek: {
      type: Number,
      min: 0,
      max: 7,
      default: null,
    },

    energyLevel: {
      type: String,
      enum: [
        "low",
        "below_average",
        "normal",
        "good",
        "excellent",
      ],
      default: "normal",
    },

    goalProgress: {
      type: String,
      enum: [
        "too_slow",
        "on_track",
        "too_fast",
        "not_sure",
      ],
      default: "not_sure",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

dietProgressSchema.index({
  user: 1,
  recordedAt: -1,
});

dietProgressSchema.index({
  dietProfile: 1,
  recordedAt: -1,
});

const DietProgress =
  mongoose.models.DietProgress ||
  mongoose.model("DietProgress", dietProgressSchema);

export default DietProgress;