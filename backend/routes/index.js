// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const eventRoutes = require('./event');
const guestRoutes = require('./guest');
const invitationRoutes = require('./invitation');
const userRoutes = require('./user');
const webhookRoutes = require('./webhook');

// Register routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/guests', guestRoutes);
router.use('/api', invitationRoutes); // For both public and private invitation routes
router.use('/users', userRoutes);
router.use('/webhooks', webhookRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;