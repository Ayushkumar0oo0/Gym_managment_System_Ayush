import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Member who should receive the notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Notification category
    type: {
      type: String,
      enum: [
        "product_ready",
        "payment",
        "membership",
        "promotion",
        "general",
      ],
      required: true,
    },

    // Short notification heading
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // Notification message
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Optional product order related to notification
    productOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductOrder",
      default: null,
    },

    // Optional link the member can open
    link: {
      type: String,
      trim: true,
      default: null,
    },

    // Whether member has opened/read it
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // When member read the notification
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    notificationSchema
  );

export default Notification;