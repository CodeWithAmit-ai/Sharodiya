
import express from "express";
import multer from "multer";
import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";
import Puja from "../models/Puja.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, and WebP images are allowed.")
      );
    }

    callback(null, true);
  }
});

function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sharodiya/pujas",
        resource_type: "image"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(stream);
  });
}

router.post("/", requireAdmin, (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Image upload failed."
      });
    }

    next();
  });
}, async (req, res) => {
  let uploadedImage;

  try {
   const {
  title,
  location,
  year,
  description,
  googleMapsUrl
} = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 150 ||
      typeof location !== "string" ||
      !location.trim() ||
      location.trim().length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Puja name and location."
      });
    }

    const parsedYear = Number(year);

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > new Date().getFullYear() + 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid year."
      });
    }
let validatedGoogleMapsUrl = "";

if (typeof googleMapsUrl === "string" && googleMapsUrl.trim()) {
  try {
    const parsedUrl = new URL(googleMapsUrl.trim());

    if (
      parsedUrl.protocol !== "https:" ||
      !["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"].includes(parsedUrl.hostname)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid HTTPS Google Maps link."
      });
    }

    validatedGoogleMapsUrl = parsedUrl.href;
  } catch {
    return res.status(400).json({
      success: false,
      message: "Enter a valid Google Maps URL."
    });
  }
}
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a photograph."
      });
    }

    if (
      typeof description === "string" &&
      description.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be 2000 characters or fewer."
      });
    }

    uploadedImage = await uploadToCloudinary(req.file.buffer);

    const puja = await Puja.create({
      title: title.trim(),
      location: location.trim(),
      googleMapsUrl: validatedGoogleMapsUrl,
      year: parsedYear,
      description:
        typeof description === "string" ? description.trim() : "",
      imageUrl: uploadedImage.secure_url,
      publicId: uploadedImage.public_id
    });

    res.status(201).json({
      success: true,
      message: "Puja entry uploaded successfully.",
      data: puja
    });
  } catch (error) {
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }

    console.error("Puja upload error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to upload the Puja entry. Please try again."
    });
  }
});

// Delete a Puja entry and its Cloudinary image
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id);

    if (!puja) {
      return res.status(404).json({
        success: false,
        message: "Puja entry not found."
      });
    }

    // Delete the hosted image if it has a Cloudinary public ID
    if (puja.publicId) {
      await cloudinary.uploader.destroy(puja.publicId);
    }

    // Delete the database entry
    await puja.deleteOne();

    return res.json({
      success: true,
      message: "Puja entry deleted successfully."
    });
  } catch (error) {
    console.error("Puja deletion error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete the Puja entry."
    });
  }
});


export default router;
