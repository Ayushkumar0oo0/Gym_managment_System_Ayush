import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "equipment_issue",
        "staff_complaint",
        "member_complaint",
        "cleanliness",
        "product_recommendation",
        "new_equipment_request",
        "suggestion",
        "other",
      ],
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    productName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    status: {
      type: String,
      enum: ["new", "reviewing", "resolved", "rejected"],
      default: "new",
      index: true,
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, createdAt: -1 });

const Feedback =
  mongoose.models.Feedback ||
  mongoose.model("Feedback", feedbackSchema);

export default Feedback;