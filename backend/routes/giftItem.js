// backend/routes/giftItem.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const giftItemController = require('../controllers/giftItemController');
const { auth } = require('../middlewares');
const { validateRequest } = require('../middlewares/validation');
const { check } = require('express-validator');

// Validation pour la création et mise à jour de cadeau
const giftItemValidation = [
  check('name')
    .notEmpty()
    .withMessage('Le nom est requis')
    .trim(),
  check('description')
    .optional()
    .trim(),
  check('quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un entier positif')
    .toInt(),
  check('isEssential')
    .optional()
    .isBoolean()
    .withMessage('Le champ isEssential doit être un booléen')
    .toBoolean(),
  check('imageUrl')
    .optional()
    .isURL()
    .withMessage('L\'URL de l\'image doit être valide')
    .trim()
];

// Validation pour l'assignation de cadeau
const assignValidation = [
  check('guestId')
    .notEmpty()
    .withMessage('L\'identifiant de l\'invité est requis')
    .isMongoId()
    .withMessage('L\'identifiant de l\'invité doit être valide'),
  check('quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un entier positif')
    .toInt(),
  check('message')
    .optional()
    .trim()
];

// Routes publiques (accessibles aux invités)
router.get('/', giftItemController.getAllGiftItems);
router.get('/:giftId', giftItemController.getGiftItemById);
router.post(
  '/:giftId/assign', 
  assignValidation, 
  validateRequest, 
  giftItemController.assignGiftItem
);
router.post(
  '/:giftId/unassign', 
  [check('guestId').notEmpty().withMessage('L\'identifiant de l\'invité est requis').isMongoId()], 
  validateRequest, 
  giftItemController.unassignGiftItem
);
router.get(
  '/reservations/:guestId', 
  giftItemController.getGuestReservations
);

// Routes protégées (organisateur uniquement)
router.post(
  '/', 
  auth, 
  giftItemValidation, 
  validateRequest, 
  giftItemController.createGiftItem
);
router.put(
  '/:giftId', 
  auth, 
  giftItemValidation, 
  validateRequest, 
  giftItemController.updateGiftItem
);
router.delete(
  '/:giftId', 
  auth, 
  giftItemController.deleteGiftItem
);
router.put(
  '/reorder', 
  auth, 
  [check('items').isArray().withMessage('Les données items doivent être un tableau')], 
  validateRequest, 
  giftItemController.reorderGiftItems
);

module.exports = router;