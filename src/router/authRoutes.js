import passport from "passport";
import jwt from "jsonwebtoken";
import express from "express";
import {
  googleSignInCallback,
  googleSignIn,
  userData,
  verifyFirstTimer,
} from "../controllers/authController.js";
import { refreshToken } from "../controllers/TokenContoller.js";
import jwtVerification from "../middlewares/jwtVerification.js";
import { limiter } from "../middlewares/rateLimiter.js";
import { logOut } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.get("/google", googleSignIn);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google",
  }),
  googleSignInCallback,
  (err, req, res, next) => {
    console.error("Passport Authentication Error:", err);
    console.error("Error Stack:", err.stack);
    res
      .status(500)
      .json({ error: "Authentication failed", details: err.message });
  }
);

authRouter.get("/user", jwtVerification, limiter, userData);
authRouter.get("/sp-delta-vitals", limiter, refreshToken);
authRouter.post("/logout", limiter, logOut);
authRouter.patch("/first-timer", jwtVerification, limiter, verifyFirstTimer);
export default authRouter;
