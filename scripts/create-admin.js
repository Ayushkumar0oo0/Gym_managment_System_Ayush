const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdmin() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env.local");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    // Load the actual User model so Mongoose registers it
    await import("../src/models/User.js");

    // Get the registered Mongoose model directly
    const User = mongoose.models.User;

    if (!User) {
      throw new Error(
        "User model was not registered. Check src/models/User.js export."
      );
    }

    console.log("User model loaded");

    const email = "admin@gym.com";
    const password = "Admin@12345";

    // Check whether admin already exists
    const existingUser = await User.findOne({ email }).select("+password");

    if (existingUser) {
      console.log("User already exists.");

      if (existingUser.role !== "admin") {
        existingUser.role = "admin";
        existingUser.isActive = true;

        await existingUser.save();

        console.log("Existing user converted to admin.");
      } else {
        console.log("This account is already an admin.");
      }

      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await User.create({
      name: "Gym Admin",
      email: email,
      phone: "9999999999",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("");
    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log("Email:", admin.email);
    console.log("Password:", password);
    console.log("Role:", admin.role);
    console.log("=================================");

    await mongoose.disconnect();
  } catch (error) {
    console.error("");
    console.error("FAILED TO CREATE ADMIN:");
    console.error(error);

    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();