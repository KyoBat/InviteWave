// routes/event.js
const express = require('express');
const router = express.Router();
const { eventController } = require('../controllers');
const { auth, validation, upload } = require('../middlewares');
const Joi = require('joi');

// Validation schemas
const createEventSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().allow('', null),
  date: Joi.date().iso().required(),
  location: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number()
    }).allow(null)
  }).required(),
  theme: Joi.string().allow('', null),
  coverImage: Joi.string().allow('', null)
});

const updateEventSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().allow('', null),
  date: Joi.date().iso(),
  location: Joi.object({
    address: Joi.string(),
    coordinates: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number()
    }).allow(null)
  }),
  theme: Joi.string().allow('', null),
  coverImage: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'completed', 'cancelled')
});

// Routes
router.get('/', auth.auth, eventController.getEvents);
router.post('/', auth.auth, validation.validateBody(createEventSchema), eventController.createEvent);
router.get('/:id', auth.auth, eventController.getEventById);
router.put('/:id', auth.auth, validation.validateBody(updateEventSchema), eventController.updateEvent);
router.delete('/:id', auth.auth, eventController.deleteEvent);
router.get('/:id/stats', auth.auth, eventController.getEventStats);

// Upload event cover image
router.post('/upload-cover', auth.auth, upload.upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;
