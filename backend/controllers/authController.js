// controllers/authController.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendResetPasswordEmail } = require('../services/emailService');
const config = require('../config');

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry
  });

  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry
  });

  return { accessToken, refreshToken };
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone
    });

    await user.save();

    // Generate tokens
    const tokens = generateTokens(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = generateTokens(user._id);

    res.json({
      message: 'Login successful',
      user,
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(decoded.userId);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if the user exists or not for security
      return res.json({ message: 'If a user with that email exists, a password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user._id }, config.jwt.resetSecret, {
      expiresIn: '1h'
    });

    // Send reset password email
    await sendResetPasswordEmail(user.email, resetToken);

    res.json({ message: 'If a user with that email exists, a password reset link has been sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process request', error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.resetSecret);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Invalid token' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};