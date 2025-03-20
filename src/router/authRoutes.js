import passport from "passport";
import jwt from "jsonwebtoken";
import express from "express";
import {
  googleSignInCallback,
  googleSignIn,
} from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.get("/google", googleSignIn);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleSignInCallback
);

export default authRouter;
