// controllers/invitationController.js
const { Invitation, Event, Guest } = require('../models');
const { sendWhatsAppInvitation } = require('../services/whatsappService');
const { sendEmailInvitation } = require('../services/emailService');

// Get all invitations for an event
exports.getEventInvitations = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Check if event exists and belongs to user
    const event = await Event.findOne({
      _id: eventId,
      creator: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get invitations
    const invitations = await Invitation.find({ event: eventId })
      .populate('guest')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invitations', error: error.message });
  }
};

// Create invitations for an event
exports.createInvitations = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { guestIds, message, sendMethod } = req.body;
    
    // Validate input
    if (!Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ message: 'Guest IDs are required' });
    }
    
    if (!['whatsapp', 'email', 'both'].includes(sendMethod)) {
      return res.status(400).json({ message: 'Valid send method is required' });
    }

    // Check if event exists and belongs to user
    const event = await Event.findOne({
      _id: eventId,
      creator: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if all guests exist and belong to user
    const guests = await Guest.find({
      _id: { $in: guestIds },
      createdBy: req.user._id
    });

    if (guests.length !== guestIds.length) {
      return res.status(400).json({ message: 'One or more guests not found' });
    }

    // Create invitations
    const invitations = [];
    for (const guest of guests) {
      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({ 
        event: eventId, 
        guest: guest._id 
      });
      
      if (existingInvitation) {
        continue; // Skip if invitation already exists
      }

      // Create new invitation
      const invitation = new Invitation({
        event: eventId,
        guest: guest._id,
        message: message || `You're invited to ${event.name}!`,
        sendMethod
      });
      
      await invitation.save();
      invitations.push(invitation);
    }

    res.status(201).json({
      message: `Successfully created ${invitations.length} invitations`,
      invitations
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create invitations', error: error.message });
  }
};

// Get invitation details by code (public)
exports.getInvitationByCode = async (req, res) => {
  try {
    const code = req.params.code;
    
    const invitation = await Invitation.findOne({ uniqueCode: code })
      .populate('event')
      .populate('guest');
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    res.json({
      invitation: {
        code: invitation.uniqueCode,
        event: {
          _id: invitation.event._id, // Ajoutez cette propriété
          name: invitation.event.name,
          date: invitation.event.date,
          location: invitation.event.location,
          description: invitation.event.description,
          theme: invitation.event.theme,
          coverImage: invitation.event.coverImage
        },
        guest: {
          name: invitation.guest.name
        },
        response: invitation.response,
        message: invitation.message
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invitation', error: error.message });
  }
};

// Respond to invitation (public)
exports.respondToInvitation = async (req, res) => {
  try {
    const code = req.params.code;
    const { status, message } = req.body;
    
    if (!['yes', 'no', 'maybe'].includes(status)) {
      return res.status(400).json({ message: 'Valid response status is required' });
    }

    const invitation = await Invitation.findOne({ uniqueCode: code });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Update response
    invitation.response = {
      status,
      message: message || '',
      respondedAt: new Date()
    };

    await invitation.save();

    res.json({
      message: 'Response recorded successfully',
      response: invitation.response
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record response', error: error.message });
  }
};

// Send invitations
exports.sendInvitations = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { invitationIds } = req.body;
    
    if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
      return res.status(400).json({ message: 'Invitation IDs are required' });
    }

    // Check if event exists and belongs to user
    const event = await Event.findOne({
      _id: eventId,
      creator: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get invitations
    const invitations = await Invitation.find({
      _id: { $in: invitationIds },
      event: eventId,
      status: { $ne: 'sent' } // Only process unsent invitations
    }).populate('guest');

    if (invitations.length === 0) {
      return res.status(400).json({ message: 'No valid invitations to send' });
    }

    // Send invitations
    const results = {
      success: [],
      failed: []
    };

    for (const invitation of invitations) {
      try {
        const guest = invitation.guest;
        const invitationUrl = `${process.env.FRONTEND_URL}/invitation/${invitation.uniqueCode}`;
        
        let sent = false;
        
        // Send based on method
        if (invitation.sendMethod === 'email' || invitation.sendMethod === 'both') {
          if (guest.email) {
            await sendEmailInvitation(guest.email, guest.name, event, invitation.message, invitationUrl);
            sent = true;
          } else if (invitation.sendMethod === 'email') {
            throw new Error('Email address not available');
          }
        }
        
        if (invitation.sendMethod === 'whatsapp' || invitation.sendMethod === 'both') {
          if (guest.phone) {
            await sendWhatsAppInvitation(guest.phone, guest.name, event, invitation.message, invitationUrl);
            sent = true;
          } else if (invitation.sendMethod === 'whatsapp') {
            throw new Error('Phone number not available');
          }
        }

        // Check if at least one method was successful
        if (!sent) {
          throw new Error('No valid contact method available for this guest');
        }

        // Update invitation status
        invitation.status = 'sent';
        invitation.sentAt = new Date();
        await invitation.save();
        
        results.success.push(invitation._id);
      } catch (error) {
        // Mark as failed
        console.error('Send invitation error:', error);
  
        // Determine error type for more precise message
        let errorMessage = 'Failed to send';
        
        if (error.code === 'EAUTH') {
          errorMessage = 'Email authentication failed. Please check your email credentials in the application settings.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Mark invitation as failed with informative message
        invitation.status = 'failed';
        invitation.failureReason = errorMessage;
        await invitation.save();
        
        results.failed.push({
          id: invitation._id,
          error: errorMessage
        });
      } 
    }

    res.json({
      message: `Sent ${results.success.length} invitations, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send invitations', error: error.message });
  }
};