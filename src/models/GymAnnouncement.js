import mongoose from "mongoose";

const gymAnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        "full_day_closed",
        "morning_closed",
        "evening_closed",
        "general",
      ],
      required: true,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const GymAnnouncement =
  mongoose.models.GymAnnouncement ||
  mongoose.model(
    "GymAnnouncement",
    gymAnnouncementSchema
  );

export default GymAnnouncement;