import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[0-9]{10}$/,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    sessionVersion: {
  type: Number,
  default: 0,
  min: 0,
},

    gender: {
      type: String,
      enum: ["male", "female"],
      required: function () {
        return this.role === "member";
      },
    },

    // -----------------------------------------
    // Registration fee
    // -----------------------------------------

    registrationFeePaid: {
      type: Boolean,
      default: false,
    },

    registrationFeePaidAt: {
      type: Date,
      default: null,
    },

    registrationFeeWaived: {
      type: Boolean,
      default: false,
    },

    // -----------------------------------------
    // Emergency contact
    // -----------------------------------------

    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      maxlength: 10,
      default: "",
      match: /^(|[0-9]{10})$/,
    },

    emergencyContactRelation: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// -----------------------------------------
// Emergency contact validation
// -----------------------------------------

userSchema.pre("validate", function () {
  if (
    this.emergencyContactPhone &&
    this.phone &&
    this.emergencyContactPhone === this.phone
  ) {
    this.invalidate(
      "emergencyContactPhone",
      "Emergency contact phone cannot be the same as the user's phone number."
    );
  }
});

// -----------------------------------------
// Model
// -----------------------------------------

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

export default User;