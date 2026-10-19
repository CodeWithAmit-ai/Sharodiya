
import mongoose from "mongoose";

const pujaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    year: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    imageUrl: {
      type: String,
      required: true
    },

    publicId: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      default: "Durga Puja"
    }
  },
  {
    timestamps: true
  }
);

const Puja = mongoose.model("Puja", pujaSchema);

export default Puja;
