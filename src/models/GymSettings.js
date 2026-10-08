import mongoose from "mongoose";

const phoneNumberSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "",
      trim: true,
    },

    number: {
      type: String,
      default: "",
      trim: true,
    },

    isWhatsApp: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const timingSessionSchema = new mongoose.Schema(
  {
    open: {
      type: String,
      default: "06:00",
      trim: true,
    },

    close: {
      type: String,
      default: "10:00",
      trim: true,
    },
  },
  { _id: false }
);

const gymSettingsSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC INFORMATION
    // =====================================================

    gymName: {
      type: String,
      required: true,
      trim: true,
    },

    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    heroImageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    tagline: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // LOCATION
    // =====================================================

    address: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // CONTACT
    // =====================================================

    phoneNumbers: {
      type: [phoneNumberSchema],
      default: [],
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // =====================================================
    // GYM TIMINGS
    //
    // Monday - Saturday:
    // Morning + Evening
    //
    // Sunday:
    // Closed
    //
    // Stored internally as 24-hour HH:mm.
    // Admin UI displays AM/PM.
    // =====================================================

    timings: {
      morning: {
        type: timingSessionSchema,
        default: () => ({
          open: "06:00",
          close: "10:00",
        }),
      },

      evening: {
        type: timingSessionSchema,
        default: () => ({
          open: "16:00",
          close: "21:00",
        }),
      },

      sundayClosed: {
        type: Boolean,
        default: true,
      },
    },

    // =====================================================
    // SOCIAL MEDIA
    // =====================================================

    instagramUrl: {
      type: String,
      default: "",
      trim: true,
    },

    facebookUrl: {
      type: String,
      default: "",
      trim: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // GYM STATUS
    // =====================================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const GymSettings =
  mongoose.models.GymSettings ||
  mongoose.model(
    "GymSettings",
    gymSettingsSchema
  );

export default GymSettings;