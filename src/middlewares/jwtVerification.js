import jwt from "jsonwebtoken";

const jwtVerfication = (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(400).json({
      success: false,
      message: "Authentication failed due to invalid token",
    });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(201)
        .json({ success: false, message: "verification failed" });
    }
    req.user = decoded;
    next();
  });
};

export default jwtVerfication;
