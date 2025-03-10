// backend/controllers/index.js
// Mise à jour pour inclure le contrôleur de cadeaux

const authController = require('./authController');
const userController = require('./userController');
const eventController = require('./eventController');
const guestController = require('./guestController');
const invitationController = require('./invitationController');
const giftItemController = require('./giftItemController'); // Nouveau contrôleur

module.exports = {
  authController,
  userController,
  eventController,
  guestController,
  invitationController,
  giftItemController // Ajout à l'exportation
};