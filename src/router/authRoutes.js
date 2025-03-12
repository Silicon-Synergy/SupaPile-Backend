import passport from "passport";
import jwt from "jsonwebtoken";
import express from "express";
import jwtVerfication from "../middlewares/jwtVerification";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),

  (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication failure" });
    }
    const token = jwt.sign(
      {
        id: req.user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );
    res.cookie("Authorization", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      sameSite: "strict", // Prevents CSRF attacks
    });
    res.redirect("http://localhost:3000/");
  }
);

export default router;
