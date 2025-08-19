import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utilities/generateTokens.js";

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  console.log("All cookies:", req.cookies);
  console.log("Refresh token:", refreshToken);
  
  if (!refreshToken) {
    return res.status(404).json({ message: "no token provided" });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    console.log(decoded);
    
    if (!decoded) {
      return res.status(200).json({ message: "unAuthorized" });
    }
    
    const accessToken = generateAccessToken(decoded.id);
    console.log(accessToken);
    
    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
      ...(isProduction && { domain: ".railway.app" }),
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
