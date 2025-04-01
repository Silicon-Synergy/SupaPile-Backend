import jwt from "jsonwebtoken";

export const generateAccessToken = (_id) => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshAcessToken = (_id) => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
