import jwt from "jsonwebtoken";
import { generatePulse } from "../utilities/generateTokens.js";

export const refreshToken = async (req, res) => {
  const { delta } = req.cookies;
  console.log(req.cookies)
  if (!delta) {
    return res.status(404).json({ message: "no token provided" });
  }
  try {
    const decoded = jwt.verify(delta, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded) {
      return res.status(200).json({ message: "unAuthorized" });
    }
    const newPulse = generatePulse(decoded.id);
    console.log(newPulse);
    res.cookie("pulse", newPulse, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });
    
    return res.status(200).json({ 
      success: true, 
      message: "Token refreshed successfully" 
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Token Expired" });
    }
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
