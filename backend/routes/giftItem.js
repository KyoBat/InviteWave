// routes/giftItem.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { giftItemController } = require('../controllers');
const { auth } = require('../middlewares');
const Joi = require('joi');
const { validation } = require('../middlewares');

// Validation schemas
const createGiftItemSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow('', null).trim(),
  quantity: Joi.number().integer().min(1).required(),
  isEssential: Joi.boolean().default(false),
  imageUrl: Joi.string().uri().allow('', null).trim(),
  //eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }
});

const updateGiftItemSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow('', null).trim(),
  quantity: Joi.number().integer().min(1).required(),
  isEssential: Joi.boolean().default(false),
  imageUrl: Joi.string().uri().allow('', null).trim()
});

const reorderGiftItemsSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      order: Joi.number().integer().min(0).required()
    })
  ).required()
});

const assignGiftItemSchema = Joi.object({
  guestId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  message: Joi.string().allow('', null).trim()
});

const unassignGiftItemSchema = Joi.object({
  guestId: Joi.string().required()
});

// GET routes
router.get('/', giftItemController.getAllGiftItems);
router.get('/reservations/:guestId', giftItemController.getGuestReservations);
router.get('/:giftId', giftItemController.getGiftItemById);

// POST routes with validation
router.post(
  '/:giftId/assign',
  validation.validateBody(assignGiftItemSchema),
  giftItemController.assignGiftItem
);

router.post(
  '/:giftId/unassign',
  validation.validateBody(unassignGiftItemSchema),
  giftItemController.unassignGiftItem
);

// Create route with validation
router.post(
  '/',
  auth.auth,
  validation.validateBody(createGiftItemSchema),
  giftItemController.createGiftItem
);

// PUT routes with validation
// Note: specific route must be before the route with parameter
router.put(
  '/reorder',
  auth.auth,
  validation.validateBody(reorderGiftItemsSchema),
  giftItemController.reorderGiftItems
);

router.put(
  '/:giftId',
  auth.auth,
  validation.validateBody(updateGiftItemSchema),
  giftItemController.updateGiftItem
);

// DELETE route
router.delete('/:giftId', auth.auth, giftItemController.deleteGiftItem);

module.exports = router;