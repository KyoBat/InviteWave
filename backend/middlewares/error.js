// middlewares/error.js
/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Check if headers already sent
    if (res.headersSent) {
      return next(err);
    }
  
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate key error',
        error: `The ${Object.keys(err.keyValue)[0]} already exists`
      });
    }
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation error',
        error: messages.join(', ')
      });
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
        error: err.message
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        error: err.message
      });
    }
  
    // Default to 500 server error
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
  };

  