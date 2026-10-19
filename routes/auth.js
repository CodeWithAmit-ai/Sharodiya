
import express from "express";
import bcrypt from "bcrypt";
import { rateLimit } from "express-rate-limit";
import Admin from "../models/Admin.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false
});

// Admin login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 100 ||
      password.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid username and password."
      });
    }

    const admin = await Admin.findOne({
      username: username.trim().toLowerCase()
    });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password."
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Unable to start an admin session."
        });
      }

      req.session.adminId = admin._id.toString();

      req.session.save((saveError) => {
        if (saveError) {
          return res.status(500).json({
            success: false,
            message: "Unable to save your session."
          });
        }

        return res.json({
          success: true,
          message: "Admin login successful."
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

// Check whether an admin is logged in
router.get("/me", requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "You are logged in as an admin."
  });
});

// Admin logout
router.post("/logout", requireAdmin, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Unable to log out."
      });
    }

    res.clearCookie("sharodiya.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

export default router;
