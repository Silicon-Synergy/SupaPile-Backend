import jwt from "jsonwebtoken";

const jwtVerification = (req, res, next) => {
  console.log(req.cookies);
  const { accessToken } = req.cookies;
  if (!accessToken)
    return res.status(401).json({
      success: false,
      message: "unauthorized",
    });

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token has expired");
      return res.status(401).json({ success: false, message: "unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

export default jwtVerification;
