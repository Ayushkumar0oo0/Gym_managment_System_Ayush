const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

async function createAdmin() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(uri);
    console.log("MongoDB connected");

    // Import User model
    await import("../src/models/User.js");

    // Get the actual Mongoose model
    const User = mongoose.models.User;

    console.log("User model:", typeof User);
    console.log("findOne:", typeof User?.findOne);
    console.log("create:", typeof User?.create);

    if (!User || typeof User.findOne !== "function") {
      throw new Error("User model was not loaded correctly");
    }

    const email = "admin@gym.com";
    const password = "Admin@12345";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("User already exists");

      existingUser.role = "admin";
      existingUser.isActive = true;

      await existingUser.save();

      console.log("Existing user is now admin.");

      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = new User({
      name: "Gym Admin",
      email,
      phone: "9999999999",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    await admin.save();

    console.log("");
    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role:", admin.role);
    console.log("=================================");

    await mongoose.disconnect();
  } catch (error) {
    console.error("");
    console.error("FAILED TO CREATE ADMIN:");
    console.error(error);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
}

createAdmin();