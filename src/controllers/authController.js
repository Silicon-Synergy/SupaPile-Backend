import passport from "passport";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utilities/generateTokens.js";
import { generateRefreshAcessToken } from "../utilities/generateTokens.js";
import User from "../models/userModel.js";
export const googleSignIn = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleSignInCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication failure" });
    }
    console.log(req.user._id);
    const accessToken = generateAccessToken(req.user._id);
    const refreshToken = generateRefreshAcessToken(req.user._id);
    console.log(accessToken);
    console.log(refreshToken);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction, // Set to true in production, false in development (localhost)
      sameSite: "Lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction, // Same here
      sameSite: "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("Test Headers:", res.getHeaders());
    // res.send("Cookies set, check DevTools");
    //i need to replace with the actual website domain
    res.redirect("http://localhost:2000");
  } catch (error) {
    console.log(error);
  }
};

export const userData = async (req, res) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    return res
      .status(404)
      .json({ succes: false, message: "user UnAuthorized" });
  }
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  console.log(decoded);
  console.log(decoded.id);
  try {
    const user = await User.findOne({ _id: decoded.id }).select([
      "profilePicture",
      "name",
      "-_id",
    ]);
    console.log(user);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.log(error);
  }
};
