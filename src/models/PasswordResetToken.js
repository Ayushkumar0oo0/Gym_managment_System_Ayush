import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Never store the actual reset token.
     * Only the SHA-256 hash is stored in MongoDB.
     */
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    /*
     * Token expires automatically through MongoDB TTL.
     */
    expiresAt: {
      type: Date,
      required: true,
    },

    /*
     * Prevents a reset token from being reused.
     */
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Automatically delete expired reset tokens.
 */
passwordResetTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const PasswordResetToken =
  mongoose.models.PasswordResetToken ||
  mongoose.model("PasswordResetToken", passwordResetTokenSchema);

export default PasswordResetToken;