// web-client/src/services/index.js
import * as authService from './auth';
import * as userService from './user';
import * as eventService from './event';
import * as guestService from './guest';
import * as invitationService from './invitation';
import * as giftService from './gift'; // Nouveau service

export {
  authService,
  userService,
  eventService,
  guestService,
  invitationService,
  giftService // Ajout à l'exportation
};
