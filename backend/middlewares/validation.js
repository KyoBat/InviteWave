// middlewares/validation.js
/**
 * Middleware to validate request body against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware
 */
exports.validateBody = (schema) => {
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
  };
  
  /**
   * Middleware to validate request params against a schema
   * @param {Object} schema - Joi schema
   * @returns {Function} - Express middleware
   */
  exports.validateParams = (schema) => {
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
  };
  
  /**
   * Middleware to validate request query against a schema
   * @param {Object} schema - Joi schema
   * @returns {Function} - Express middleware
   */
  exports.validateQuery = (schema) => {
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
  };
  