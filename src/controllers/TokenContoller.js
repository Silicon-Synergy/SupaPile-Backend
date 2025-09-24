import jwt from "jsonwebtoken";
import { generateSpPulse } from "../utilities/generateTokens.js";

export const refreshToken = async (req, res) => {
  const { "sp-delta": spDelta } = req.cookies;
  console.log(req.cookies)
  if (!spDelta) {
    return res.status(404).json({ message: "unAuthorized"});
  }
  try {
    const decoded = jwt.verify(spDelta, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded) {
      return res.status(200).json({ message: "unAuthorized" });
    }
    const newSpPulse = generateSpPulse(decoded.id);
    console.log(newSpPulse);
    
    // Fix: Add maxAge to prevent session-only cookie
    res.cookie("sp-pulse", newSpPulse, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 60 * 60 * 1000, // 1 hour instead of 15 minutes
    });
    
    return res.status(200).json({ 
      success: true, 
      message: "authorized" 
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "unauthorized" });
    }
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
