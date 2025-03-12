const { validationResult } = require('express-validator');
const Joi = require('joi');

// Middleware pour express-validator
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
}

/**
 * Middleware to validate request body against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: error.details[0].message 
      });
    }
    next();
  };
}

/**
 * Middleware to validate request params against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: error.details[0].message 
      });
    }
    next();
  };
}

/**
 * Middleware to validate request query against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: error.details[0].message 
      });
    }
    next();
  };
}

module.exports = {
  validateRequest,
  validateBody,
  validateParams,
  validateQuery
};