import mongoose from "mongoose";

const adminActivitySchema = new mongoose.Schema(
  {
    // =========================
    // ADMIN WHO PERFORMED ACTION
    // =========================
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================
    // ACTION
    // =========================
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // =========================
    // ENTITY TYPE
    // =========================
    // Example:
    // Payment
    // User
    // Membership
    // Promotion
    // GymSettings
    // ProductOrder
    // =========================
    entityType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    // =========================
    // ENTITY ID
    // =========================
    // ID of the document affected
    // by the admin action.
    // =========================
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // =========================
    // DESCRIPTION
    // =========================
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // =========================
    // EXTRA INFORMATION
    // =========================
    // Can contain useful information
    // related to the action.
    //
    // Example:
    // {
    //   amount: 3000,
    //   paymentMethod: "cash",
    //   memberName: "Ayush"
    // }
    // =========================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// INDEXES
// =========================

// Find activities of a particular admin
adminActivitySchema.index({
  admin: 1,
  createdAt: -1,
});

// Find activities for a particular entity
adminActivitySchema.index({
  entityType: 1,
  entityId: 1,
  createdAt: -1,
});

// Quickly show latest activities
adminActivitySchema.index({
  createdAt: -1,
});

// =========================
// MODEL
// =========================

const AdminActivity =
  mongoose.models.AdminActivity ||
  mongoose.model("AdminActivity", adminActivitySchema);

export default AdminActivity;