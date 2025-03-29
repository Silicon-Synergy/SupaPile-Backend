import express from "express";
import dotenv from "dotenv";
dotenv.config();
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { dbConnect } from "./config/db.js";
import "./config/passport.js";
import passport from "passport";
import authRouter from "./src/router/authRoutes.js";
import actionRouter from "./src/router/actionRoute.js";
// import userRouter from "./src/router/userRoutes.js"; // Uncomment if needed

const PORT = process.env.PORT || 5000;
const app = express();

// Rate limiter (15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later",
  headers: true,
});

// Middlewares
app.use(limiter);
app.use(helmet());
app.use(
  cors({
    origin: "https://your-frontend.com", // Change this
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use("/auth", authRouter);
app.use("/api", actionRouter);
// app.use("/api/users", userRouter); // Uncomment if needed

// Connect to MongoDB and Start Server
const startServer = async () => {
  try {
    await dbConnect();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1);
  }
};

startServer();
