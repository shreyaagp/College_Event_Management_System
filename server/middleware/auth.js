const jwt = require('jsonwebtoken');

// Auth middleware to protect routes
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded; // contains id, email, role
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// College email validator
const validateCollegeEmail = (email) => {
  const allowedDomain = (process.env.COLLEGE_EMAIL_DOMAIN || '@nie.ac.in').toLowerCase();
  return email.trim().toLowerCase().endsWith(allowedDomain);
};

// Export under both names for compatibility
module.exports = { 
  authMiddleware: authenticate, 
  authenticate, 
  validateCollegeEmail 
};