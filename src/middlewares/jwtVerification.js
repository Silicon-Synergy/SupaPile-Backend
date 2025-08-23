import jwt from "jsonwebtoken";

const jwtVerification = (req, res, next) => {
  console.log("Cookies received:", req.cookies);
  const { "sp-pulse": spPulse } = req.cookies;

  if (!spPulse) {
    console.log("No sp-pulse found in cookies");
    return res.status(401).json({
      success: false,
      message: "unauthorized",
    });
  }

  jwt.verify(spPulse, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      if (err.name === 'TokenExpiredError') {
        console.log("Token has expired, client should refresh");
      }
      return res.status(401).json({ 
        success: false, 
        message: "unauthorized",
        tokenExpired: err.name === 'TokenExpiredError'
      });
    }
    console.log("Token verified successfully for user:", decoded.id);
    req.user = decoded;
    next();
  });
};

export default jwtVerification;
