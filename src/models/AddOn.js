import mongoose from "mongoose";

const addOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    /*
     * Examples:
     * cardio
     * personal_trainer
     */
    type: {
      type: String,
      enum: ["cardio", "personal_trainer"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

addOnSchema.index({
  type: 1,
  isActive: 1,
});

const AddOn =
  mongoose.models.AddOn ||
  mongoose.model("AddOn", addOnSchema);

export default AddOn;