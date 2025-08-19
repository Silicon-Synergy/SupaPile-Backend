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

const PORT = process.env.PORT || 5000;
const app = express();
const server = createServer(app);

// CORS configuration - MUST be before other middleware
const allowedOrigins = [
  "http://localhost:2000",
  "http://192.168.0.3:2000", 
  "http://localhost:2025",
  "https://super-pile-frontend.vercel.app",
  "chrome-extension://eiplichdddgjajjklpchhilebianmdei",
];

// Apply CORS first, before helmet
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    optionsSuccessStatus: 200,
  })
);

// Apply helmet after CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cookieParser());
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
