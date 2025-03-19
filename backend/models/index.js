// models/index.js
const User = require('./user');
const Event = require('./events');
const Guest = require('./guest');
const Invitation = require('./invitation');
const GiftItem = require('./giftItem'); // Nouveau modèle

module.exports = {
  User,
  Event,
  Guest,
  Invitation,
  GiftItem // Ajout à l'exportation
};