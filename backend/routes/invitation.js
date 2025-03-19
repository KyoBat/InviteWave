// routes/invitation.js
const express = require('express');
const router = express.Router();
const { invitationController } = require('../controllers');
const { auth, validation } = require('../middlewares');
const Joi = require('joi');

// Validation schemas
const createInvitationsSchema = Joi.object({
  guestIds: Joi.array().items(Joi.string()).required(),
  message: Joi.string().allow('', null),
  sendMethod: Joi.string().valid('whatsapp', 'email', 'both').required()
});

const respondSchema = Joi.object({
  status: Joi.string().valid('yes', 'no', 'maybe').required(),
  message: Joi.string().allow('', null)
});

const sendInvitationsSchema = Joi.object({
  invitationIds: Joi.array().items(Joi.string()).required()
});

// Routes
router.get('/events/:eventId/invitations', auth.auth, invitationController.getEventInvitations);
router.post('/events/:eventId/invitations', auth.auth, validation.validateBody(createInvitationsSchema), invitationController.createInvitations);
router.post('/events/:eventId/invitations/send', auth.auth, validation.validateBody(sendInvitationsSchema), invitationController.sendInvitations);

// Public routes (no auth required)
router.get('/invitations/:code', invitationController.getInvitationByCode);
router.put('/invitations/:code/respond', validation.validateBody(respondSchema), invitationController.respondToInvitation);

module.exports = router;