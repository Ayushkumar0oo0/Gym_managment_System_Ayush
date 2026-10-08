import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Original / market price
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Gym selling price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Product can be temporarily unavailable
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Selling price should never be higher than original price
productSchema.pre("validate", function () {
  if (this.price > this.originalPrice) {
    throw new Error(
      "Selling price cannot be greater than original price."
    );
  }
});

const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;