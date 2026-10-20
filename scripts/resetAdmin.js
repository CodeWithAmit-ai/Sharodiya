
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";

async function resetAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_USERNAME or ADMIN_PASSWORD is missing from .env"
      );
    }

    if (process.env.ADMIN_PASSWORD.length < 12) {
      throw new Error("Choose a password with at least 12 characters.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB database:", mongoose.connection.name);

    const admins = await Admin.find();

    if (admins.length > 1) {
      throw new Error(
        "Multiple admin accounts found. No changes made."
      );
    }

    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      12
    );

    if (admins.length === 1) {
      admins[0].username = process.env.ADMIN_USERNAME;
      admins[0].passwordHash = passwordHash;
      await admins[0].save();
    } else {
      await Admin.create({
        username: process.env.ADMIN_USERNAME,
        passwordHash
      });
    }

    console.log("Admin credentials updated successfully.");
  } catch (error) {
    console.error("Reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

resetAdmin();
