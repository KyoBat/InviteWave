// controllers/index.js
const authController = require('./authController');
const eventController = require('./eventController');
const guestController = require('./guestController');
const invitationController = require('./invitationController');
const userController = require('./userController');

module.exports = {
  authController,
  eventController,
  guestController,
  invitationController,
  userController
};