import passport from "passport";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utilities/generateTokens.js";
import { generateRefreshAcessToken } from "../utilities/generateTokens.js";
import User from "../models/userModel.js";
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

    console.log("accessToken", accessToken, refreshToken);
    console.log("olamide");

    const isProduction = process.env.NODE_ENV === "production";

    console.log(isProduction);
    console.log("hey there");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none", // Changed for cross-domain
      path: "/",
      domain: "/.railway.app",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none", // Changed for cross-domain
      path: "/",
      domain: "/.railway.app",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (isProduction) {
      res.redirect("https://super-pile-frontend.vercel.app");
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
      secure: true,
      sameSite: "none", // Updated
      path: "/",
      domain: ".railway.app",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none", // Updated
      path: "/",
      domain: ".railway.app" // Fixed: added missing space
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
