import mongoose from "mongoose";

const razorpayWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    paymentId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    orderId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

razorpayWebhookEventSchema.index({
  eventId: 1,
});

razorpayWebhookEventSchema.index({
  paymentId: 1,
  createdAt: -1,
});

const RazorpayWebhookEvent =
  mongoose.models.RazorpayWebhookEvent ||
  mongoose.model(
    "RazorpayWebhookEvent",
    razorpayWebhookEventSchema
  );

export default RazorpayWebhookEvent;