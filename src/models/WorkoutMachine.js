import mongoose from "mongoose";

const workoutMachineSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // BASIC IDENTITY
    // --------------------------------------------------

    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      default: "",
      trim: true,
    },

    // --------------------------------------------------
    // CLASSIFICATION
    // --------------------------------------------------

    category: {
      type: String,
      required: true,
      enum: [
        "chest",
        "back",
        "shoulders",
        "legs",
        "arms",
        "core",
        "cardio",
        "functional",
        "full_body",
      ],
    },

    bodyParts: {
      type: [
        {
          type: String,
          enum: [
            "chest",
            "back",
            "shoulders",
            "legs",
            "hamstrings",
            "biceps",
            "triceps",
            "forearms",
            "abs",
            "glutes",
            "calves",
            "cardio",
            "full_body",
          ],
        },
      ],
      default: [],
    },

    muscleGroups: {
      type: [String],
      default: [],
    },

    exerciseType: {
      type: String,
      enum: [
        "machine",
        "cable",
        "free_weight",
        "bodyweight",
        "cardio",
        "functional",
      ],
      required: true,
    },

    equipmentType: {
      type: String,
      default: "machine",
      trim: true,
    },

    // --------------------------------------------------
    // WORKOUT INFORMATION
    // --------------------------------------------------

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    instructions: {
      type: [String],
      default: [],
    },

    tips: {
      type: [String],
      default: [],
    },

    commonMistakes: {
      type: [String],
      default: [],
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // --------------------------------------------------
    // DEFAULT WORKOUT PRESCRIPTION
    // --------------------------------------------------

    defaultSets: {
      type: Number,
      min: 1,
      max: 10,
      default: 3,
    },

    defaultReps: {
      type: String,
      default: "10-12",
      trim: true,
    },

    defaultRestSeconds: {
      type: Number,
      min: 0,
      default: 60,
    },

    // --------------------------------------------------
    // MACHINE COMBINATIONS
    // --------------------------------------------------

    recommendedMachineKeys: {
      type: [String],
      default: [],
    },

    alternativeMachineKeys: {
      type: [String],
      default: [],
    },

    // --------------------------------------------------
    // MEDIA
    // --------------------------------------------------

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    tutorialUrl: {
      type: String,
      default: "",
      trim: true,
    },

    tutorialPlatform: {
      type: String,
      enum: [
        "youtube",
        "instagram",
        "google_drive",
        "other",
        "",
      ],
      default: "",
    },

    // --------------------------------------------------
    // ADMIN / SYSTEM
    // --------------------------------------------------

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDefaultCatalogItem: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

// --------------------------------------------------
// INDEXES
// --------------------------------------------------

workoutMachineSchema.index({
  category: 1,
  isActive: 1,
});

workoutMachineSchema.index({
  bodyParts: 1,
  isActive: 1,
});

workoutMachineSchema.index({
  displayOrder: 1,
});

// --------------------------------------------------
// MODEL
// --------------------------------------------------

const WorkoutMachine =
  mongoose.models.WorkoutMachine ||
  mongoose.model("WorkoutMachine", workoutMachineSchema);

export default WorkoutMachine;