const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('🔐 Auth middleware - JWT_SECRET not configured');
      return res.status(500).json({ message: "Server configuration error" });
    }

    console.log('🔐 Auth middleware - cookies present:', !!req.cookies);
    
    // Get token from cookie first, then fallback to Authorization header
    let token = req.cookies?.token;
    console.log('🔐 Auth middleware - token from cookie:', token ? 'present' : 'missing');

    // If no cookie, try Authorization header (for backward compatibility)
    if (!token) {
      const authHeader = req.header("Authorization");
      console.log('🔐 Auth middleware - Authorization header present:', !!authHeader);
      if (authHeader) {
        token = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : authHeader;
      }
    }

    if (!token) {
      console.log('🔐 Auth middleware - No token found');
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
      console.log('🔐 Auth middleware - Verifying token...');
      // Verify token using JWT_SECRET from environment variables
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔐 Auth middleware - Token verified for user ID:', decoded.id);
      req.user = decoded; // Attach decoded token data (e.g., user id) to req.user
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('🔐 Auth middleware - Token verification failed:', error.message);
      return res.status(401).json({ message: "Token is not valid" });
    }
  } catch (error) {
    console.error('🔐 Auth middleware - Unexpected error:', error);
    return res.status(500).json({ message: "Internal server error in auth middleware" });
  }
};

// Role-based access control middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole
};
