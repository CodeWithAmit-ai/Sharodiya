
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";

dotenv.config();

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Set ADMIN_USERNAME and ADMIN_PASSWORD in .env first."
    );
  }

  if (username.length > 100 || password.length < 12 || password.length > 200) {
    throw new Error(
      "Use a username under 100 characters and a password between 12 and 200 characters."
    );
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existingAdmin = await Admin.findOne({ username });

  if (existingAdmin) {
    throw new Error(
      "This admin username already exists. No account was changed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await Admin.create({
    username,
    passwordHash
  });

  console.log("Admin account created successfully.");
}

try {
  await createAdmin();
} catch (error) {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
