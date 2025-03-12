// controllers/eventController.js
const { Event, Invitation } = require('../models');

// Get all events for current user
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ creator: req.user._id }).sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { name, description, date, location, theme } = req.body;
    
    const event = new Event({
      creator: req.user._id,
      name,
      description,
      date,
      location,
      theme,
      coverImage: req.body.coverImage || null
    });

    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id,
      creator: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'description', 'date', 'location', 'theme', 'coverImage', 'status'];
    
    // Check if updates are valid
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    // Find and update event
    const event = await Event.findOne({
      _id: req.params.id,
      creator: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Apply updates
    updates.forEach(update => {
      if (update === 'location' && typeof req.body.location === 'object') {
        // Handle the location object properly
        if (req.body.location.address) {
          event.location.address = req.body.location.address;
        }
        
        if (req.body.location.coordinates) {
          event.location.coordinates = {
            ...event.location.coordinates,
            ...req.body.location.coordinates
          };
        }
      } else {
        event[update] = req.body[update];
      }
    });
    
    await event.save();

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete all associated invitations
    await Invitation.deleteMany({ event: req.params.id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Check if event exists and belongs to user
    const event = await Event.findOne({
      _id: eventId,
      creator: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get invitation stats
    const invitations = await Invitation.find({ event: eventId });
    
    const stats = {
      total: invitations.length,
      sent: invitations.filter(inv => inv.status === 'sent').length,
      pending: invitations.filter(inv => inv.status === 'pending').length,
      failed: invitations.filter(inv => inv.status === 'failed').length,
      responses: {
        yes: invitations.filter(inv => inv.response.status === 'yes').length,
        no: invitations.filter(inv => inv.response.status === 'no').length,
        maybe: invitations.filter(inv => inv.response.status === 'maybe').length,
        pending: invitations.filter(inv => inv.response.status === 'pending').length
      },
      byCategory: {}
    };

    // Stats by guest category (requires population)
    const populatedInvitations = await Invitation.find({ event: eventId })
      .populate('guest');
    
    // Group by category
    populatedInvitations.forEach(inv => {
      if (inv.guest) {
        const category = inv.guest.category || 'other';
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = {
            total: 0,
            responses: { yes: 0, no: 0, maybe: 0, pending: 0 }
          };
        }
        
        stats.byCategory[category].total++;
        stats.byCategory[category].responses[inv.response.status]++;
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};