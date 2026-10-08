import mongoose from "mongoose";

const dietFoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    quantity: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    calories: {
      type: Number,
      min: 0,
      default: null,
    },

    protein: {
      type: Number,
      min: 0,
      default: null,
    },

    carbs: {
      type: Number,
      min: 0,
      default: null,
    },

    fats: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { _id: true }
);

const dietMealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    mealType: {
      type: String,
      enum: [
        "breakfast",
        "pre_workout",
        "post_workout",
        "lunch",
        "snack",
        "dinner",
        "other",
      ],
      default: "other",
    },

    time: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    foods: {
      type: [dietFoodSchema],
      default: [],
    },

    calories: {
      type: Number,
      min: 0,
      default: null,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { _id: true }
);

const dietChartSchema = new mongoose.Schema(
  {
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

    goal: {
      type: String,
      enum: [
        "weight_gain",
        "weight_loss",
        "muscle_gain",
        "maintenance",
        "general_fitness",
        "other",
      ],
      default: "general_fitness",
    },

    calories: {
      type: Number,
      min: 0,
      default: null,
    },

    protein: {
      type: Number,
      min: 0,
      default: null,
    },

    carbs: {
      type: Number,
      min: 0,
      default: null,
    },

    fats: {
      type: Number,
      min: 0,
      default: null,
    },

    meals: {
      type: [dietMealSchema],
      default: [],
    },

    instructions: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // If null, this can be used as a general/default diet chart.
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

dietChartSchema.index({
  assignedTo: 1,
  isActive: 1,
});

dietChartSchema.index({
  createdAt: -1,
});

const DietChart =
  mongoose.models.DietChart ||
  mongoose.model("DietChart", dietChartSchema);

export default DietChart;