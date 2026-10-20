import uploadRoutes from "./routes/uploads.js";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import pujaRoutes from "./routes/pujas.js";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import session from "express-session";
import MongoStore from "connect-mongo";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://res.cloudinary.com"]
      }
    }
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env");
}
app.set("trust proxy", 1);
app.use(
  session({
    name: "sharodiya.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 4 * 60 * 60
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 4 * 60 * 60 * 1000
    }
  })
);


app.use(express.static(path.join(__dirname, "public")));
app.use("/api/pujas", pujaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Sharodiya!"
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Sharodiya running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
