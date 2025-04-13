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

// const whiteList = [

//   "https://supapile-backend.up.railway.app",
// ];
// Rate limiter (15 minutes)

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: "Too many requests from this IP, please try again later",
//   headers: true,
// });

// Middlewares
// app.use(limiter);

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:2000",
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:2000",
    optionsSuccessStatus: 200,
    credentials: true,
  },
});
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use("/auth", authRouter);
app.use("/api", actionRouter);
app.use(shareRouter);
app.use(metaScrapperRouter);

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
