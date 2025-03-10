// routes/auth.js
const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { validation } = require('../middlewares');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  phone: Joi.string().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().required().min(6)
});

// Routes
router.post('/register', validation.validateBody(registerSchema), authController.register);
router.post('/login', validation.validateBody(loginSchema), authController.login);
router.post('/refresh-token', validation.validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validation.validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validation.validateBody(resetPasswordSchema), authController.resetPassword);

module.exports = router;