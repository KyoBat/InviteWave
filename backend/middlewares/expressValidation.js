// middlewares/expressValidation.js
const { validationResult } = require('express-validator');

// Middleware pour express-validator
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
};