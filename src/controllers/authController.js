import passport from "passport";
import jwt from "jsonwebtoken";

export const googleSignIn = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleSignInCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication failure" });
    }
    console.log(req.user._id)
    const token = jwt.sign(
      {
        id: req.user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );
    console.log(token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      sameSite: "strict", // Prevents CSRF attacks
    });
  } catch (error) {
    console.log(error);
  }
  res.redirect("http://localhost:3000/");
};
