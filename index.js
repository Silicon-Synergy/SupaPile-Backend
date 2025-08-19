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
import shareRouter from "./src/router/shareRoute.js";
import metaScrapperRouter from "./src/router/serviceRoute.js";
import { createServer } from "node:http";
import { Server } from "socket.io";

//variable initialization
const PORT = process.env.PORT || 5000;
const app = express();
const server = createServer(app);

// const whiteList = ["https://supapile-backend.up.railway.app"];
// Rate limiter (15 minutes)

// Middlewares
// app.use(limiter);

const allowedOrigins = [
  "http://localhost:2000",
  "http://192.168.0.3:2000",
  "http://localhost:2025",
  "https://super-pile-frontend.vercel.app",
  "chrome-extension://eiplichdddgjajjklpchhilebianmdei",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    // Add explicit cookie handling
    exposedHeaders: ['set-cookie'],
  })
);

// Move cookie-parser BEFORE helmet and configure it properly
app.use(cookieParser());

// Configure Helmet to not interfere with cookies
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Don't block cookie headers
  contentSecurityPolicy: false,
}));

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  },
});

app.use(express.json());
app.use(passport.initialize());

// Routes
app.use("/auth", authRouter);
app.use("/api/v1", actionRouter);
app.use(shareRouter);
app.use("/api/v1/services", metaScrapperRouter);

// integrating socket io
io.on("connection", (socket) => {
  console.log("A user coonnected");
});

// Connect to MongoDB and Start Server
const startServer = async () => {
  try {
    await dbConnect();
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1);
  }
};

startServer();
