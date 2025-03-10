// backend/routes/giftItem.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const giftItemController = require('../controllers/giftItemController');
const { auth } = require('../middlewares');
const { body, validationResult } = require('express-validator');

// Middleware de validation
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
};

// Routes GET
router.get('/', giftItemController.getAllGiftItems);
router.get('/reservations/:guestId', giftItemController.getGuestReservations);
router.get('/:giftId', giftItemController.getGiftItemById);

// Routes POST avec validation
router.post('/:giftId/assign', [
  body('guestId').notEmpty().withMessage('L\'identifiant de l\'invité est requis').isMongoId(),
  body('quantity').isInt({ min: 1 }).withMessage('La quantité doit être un entier positif'),
  body('message').optional().trim()
], validateRequest, giftItemController.assignGiftItem);

router.post('/:giftId/unassign', [
  body('guestId').notEmpty().withMessage('L\'identifiant de l\'invité est requis').isMongoId()
], validateRequest, giftItemController.unassignGiftItem);

// Route de création avec validation
router.post('/', auth, [
  body('name').notEmpty().withMessage('Le nom est requis').trim(),
  body('description').optional().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('La quantité doit être un entier positif'),
  body('isEssential').optional().isBoolean().withMessage('Le champ isEssential doit être un booléen'),
  body('imageUrl').optional().isURL().withMessage('L\'URL de l\'image doit être valide').trim()
], validateRequest, giftItemController.createGiftItem);

// Routes PUT avec validation
// Note: la route spécifique doit être avant la route avec paramètre
router.put('/reorder', auth, [
  body('items').isArray().withMessage('Les données items doivent être un tableau')
], validateRequest, giftItemController.reorderGiftItems);

router.put('/:giftId', auth, [
  body('name').notEmpty().withMessage('Le nom est requis').trim(),
  body('description').optional().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('La quantité doit être un entier positif'),
  body('isEssential').optional().isBoolean().withMessage('Le champ isEssential doit être un booléen'),
  body('imageUrl').optional().isURL().withMessage('L\'URL de l\'image doit être valide').trim()
], validateRequest, giftItemController.updateGiftItem);

// Route DELETE
router.delete('/:giftId', auth, giftItemController.deleteGiftItem);

module.exports = router;