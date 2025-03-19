// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');

/**
 * Middleware to authenticate user using JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // BUG FIX: Gestion améliorée des erreurs de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};