import passport from "passport";
import jwt from "jsonwebtoken";
import { generateSpPulse } from "../utilities/generateTokens.js";
import { generateSpDelta } from "../utilities/generateTokens.js";
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

    const spPulse = generateSpPulse(req.user._id);
    const spDelta = generateSpDelta(req.user._id);

    console.log("sp-pulse", spPulse, spDelta);
    console.log("olamide");

    const isProduction = process.env.NODE_ENV === "production";

    console.log(isProduction);
    console.log("hey there");

    res.cookie("sp-pulse", spPulse, {
      httpOnly: true,
      secure: true,
      sameSite: isProduction ? "None" : "Lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("sp-delta", spDelta, {
      httpOnly: true,
      secure: true,
      sameSite: isProduction ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (isProduction) {
      res.redirect("http://www.supapile.com");
    } else {
      // res.redirect("http://localhost:2000");
       res.redirect("http://www.supapile.com");
    }
  } catch (error) {
    console.log(error);
  }
};

export const userData = async (req, res) => {
  const { "sp-pulse": spPulse } = req.cookies;
  if (!spPulse) {
    return res
      .status(401)
      .json({ success: false, message: "user UnAuthorized" });
  }
  const decoded = jwt.verify(spPulse, process.env.JWT_SECRET);
  console.log(decoded);
  console.log(decoded.id);
  const cacheKey = `user:${decoded.id}`;
  const cacheResult = userCache.get(cacheKey);

  if (cacheResult) {
    return res.status(200).json({ success: true, data: cacheResult });
  }

  try {
    const user = await User.findOne({ _id: decoded.id }).select(
      "profilePicture name newTimer -_id"
    );

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
    res.clearCookie("sp-pulse", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });
    res.clearCookie("sp-delta", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    if (req.user && req.user.id) {
      const cacheKey = `user:${req.user.id}`;
      userCache.del(cacheKey);
    }

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
export const verifyFirstTimer = async (req, res) => {
  const { "sp-pulse": spPulse } = req.cookies;
  if (!spPulse) {
    return res
      .status(401)
      .json({ success: false, message: "User UnAuthorized" });
  }

  try {
    const decoded = jwt.verify(spPulse, process.env.JWT_SECRET);

    let user = await User.findById(decoded.id).select("newTimer");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.newTimer) {
      user.newTimer = true;
      await user.save();
    }

    // clear cache if you’re caching server-side
    userCache.del(`user:${decoded.id}`);

    return res.status(200).json({
      success: true,
      newTimer: user.newTimer, // return just the updated field
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
