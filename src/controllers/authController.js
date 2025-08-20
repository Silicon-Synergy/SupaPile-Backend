import passport from "passport";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utilities/generateTokens.js";
import { generateRefreshAcessToken } from "../utilities/generateTokens.js";
import User from "../models/userModel.js";
import cookie from "cookie";
import { userCache } from "../cache/cache-with-nodeCache.js";
export const googleSignIn = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleSignInCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication failure" });
    }

    const accessToken = generateAccessToken(req.user._id);
    const refreshToken = generateRefreshAcessToken(req.user._id);

    const isProduction = process.env.NODE_ENV === "production";

    console.log(isProduction);
    // cole.log("hey there");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: isProduction ? "None" : "Lax", // nged for cross-don
      path: "/", });

     res.cookie("refreshToken", refreshToken, {
       httpOnly: true,
       secure: true,
       sameSite: isProduction ? "None" : "Lax", // Changed for cross-domain
       path: "/",
       maxAge: 7 * 24 * 60 * 60 * 1000,
     });

    if (isProduction) {
      res.redirect("https://www.supapile.com");
    } else {
      res.redirect("http://localhost:2000");
    }
  } catch (error) {
    console.log(error);
  }
};

export const userData = async (req, res) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    return res
      .status(401)
      .json({ success: false, message: "user UnAuthorized" });
  }
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  console.log(decoded);
  console.log(decoded.id);
  const cacheKey = `user:${decoded.id}`;
  const cacheResult = userCache.get(cacheKey);

  if (cacheResult) {
    return res.status(200).json({ success: true, data: cacheResult });
  }

  try {
    const user = await User.findOne({ _id: decoded.id }).select([
      "profilePicture",
      "name",
      "-_id",
    ]);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    userCache.set(cacheKey, user, 300);

    console.log(user);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const logOut = async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Updated
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Updated
      path: "/",
    });

    // Clear user cache
    if (req.user && req.user.id) {
      const cacheKey = `user:${req.user.id}`;
      userCache.del(cacheKey);
    }

    // Return JSON response (let frontend handle redirect)
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
