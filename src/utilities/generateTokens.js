import jwt from "jsonwebtoken";

export const generatePulse = (_id) => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateDelta = (_id) => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const generatePublicToken = (uuID) => {
  console.log(uuID);
  return jwt.sign({ uuID }, process.env.JWT_SECRET, {
    expiresIn: "2m",
  });
};
