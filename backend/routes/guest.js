// routes/guest.js
const express = require('express');
const router = express.Router();
const { guestController } = require('../controllers');
const { auth, validation } = require('../middlewares');
const Joi = require('joi');

// Validation schemas
const createGuestSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  category: Joi.string().valid('family', 'friends', 'colleagues', 'other').default('other')
}).custom((value, helpers) => {
  if (!value.email && !value.phone) {
    return helpers.error('custom.contact', { message: 'Either email or phone is required' });
  }
  return value;
});

const updateGuestSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  category: Joi.string().valid('family', 'friends', 'colleagues', 'other')
});

const importGuestsSchema = Joi.object({
  guests: Joi.array().items(
    Joi.object({
      name: Joi.string().required().min(2).max(50),
      email: Joi.string().email().allow('', null),
      phone: Joi.string().allow('', null),
      category: Joi.string().valid('family', 'friends', 'colleagues', 'other').default('other')
    }).custom((value, helpers) => {
      if (!value.email && !value.phone) {
        return helpers.error('custom.contact', { message: 'Either email or phone is required' });
      }
      return value;
    })
  ).required()
});

// Routes
router.get('/', auth.auth, guestController.getGuests);
router.post('/', auth.auth, validation.validateBody(createGuestSchema), guestController.createGuest);
router.get('/:id', auth.auth, guestController.getGuestById);
router.put('/:id', auth.auth, validation.validateBody(updateGuestSchema), guestController.updateGuest);
router.delete('/:id', auth.auth, guestController.deleteGuest);
router.post('/import', auth.auth, validation.validateBody(importGuestsSchema), guestController.importGuests);

module.exports = router;