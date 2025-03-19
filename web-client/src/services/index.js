// web-client/src/services/index.js
import authService from './auth';
import userService from './user';
import eventService from './event';
import guestService from './guest';
import invitationService from './invitation';
import * as giftFunctions from './gift'; // Importez toutes les fonctions

// Créez l'objet giftService
const giftService = giftFunctions;

// Exportez tous les services en une seule fois
export {
  authService,
  userService,
  eventService,
  guestService,
  invitationService,
  giftService
};