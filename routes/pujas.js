
import express from "express";
import Puja from "../models/Puja.js";

const router = express.Router();

// Get all gallery entries
router.get("/", async (req, res) => {
  try {
    const pujas = await Puja.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: pujas.length,
      data: pujas
    });
  } catch (error) {
    console.error("Gallery fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load the gallery."
    });
  }
});

export default router;
