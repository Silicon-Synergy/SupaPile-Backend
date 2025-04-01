import jwt from "jsonwebtoken";

const jwtVerification = (req, res, next) => {
  const { accessToken} = req.cookies;
  if (!accessToken)
    return res.status(400).json({
      success: false,
      message: "Authentication failed due to invalid token",
    });

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(201)
        .json({ success: false, message: "Token has expired" });
    }
    req.user = decoded;
    next();
  });
};

export default jwtVerification;
