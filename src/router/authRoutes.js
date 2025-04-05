import passport from "passport";
import jwt from "jsonwebtoken";
import express from "express";
import {
  googleSignInCallback,
  googleSignIn,
  userData,
} from "../controllers/authController.js";
import { refreshToken } from "../controllers/TokenContoller.js";
import jwtVerification from "../middlewares/jwtVerification.js";
const authRouter = express.Router();

authRouter.get("/google", googleSignIn);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleSignInCallback
);
authRouter.get("/me", jwtVerification, userData);
authRouter.get("/refresh-token", refreshToken);

export default authRouter;
