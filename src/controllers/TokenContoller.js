import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utilities/generateTokens.js";

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(404).json({ message: "no token provided" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded) {
      return res.status(200).json({ message: "unAuthorized" });
    }
    const accesToken = generateAccessToken(decoded.id);
    console.log(accesToken);
    res.cookie("accessToken", accesToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prduction",
      sameSite: "strict",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Token Expired" });
    }
    console.log(error);
  }
};
