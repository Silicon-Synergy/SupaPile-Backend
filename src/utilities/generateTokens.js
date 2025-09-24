import jwt from "jsonwebtoken";

export const generateSpPulse = (_id) => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const generateSpDelta = (_id) => {
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
