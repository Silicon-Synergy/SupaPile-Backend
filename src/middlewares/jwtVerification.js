import jwt from "jsonwebtoken";

const jwtVerification = (req, res, next) => {
  // Enhanced debugging for production
  console.log("=== Cookie Debug Info ===");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Raw cookies header:", req.headers.cookie);
  console.log("Parsed cookies:", req.cookies);
  console.log("Signed cookies:", req.signedCookies);
  console.log("Environment:", process.env.NODE_ENV);
  console.log("========================");
  
  const { accessToken } = req.cookies;
  
  if (!accessToken) {
    console.log("No access token found in cookies");
    return res.status(401).json({
      success: false,
      message: "unauthorized",
    });
  }

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
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
