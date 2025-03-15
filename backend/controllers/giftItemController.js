// controllers/giftItemController.js
const mongoose = require('mongoose');
const { emailService } = require('../services');
const { GiftItem, Event, Guest, Invitation } = require('../models');

/**
 * Create a new gift item
 * @route POST /api/events/:eventId/gifts
 * @access Private (organizer)
 */
exports.createGiftItem = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists and belongs to the user
    //const event = await Event.findOne({ _id: eventId, userId: req.user._id });
    const event = await Event.findOne({ _id: eventId, creator: req.user._id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or you do not have permission to access it' 
      });
    }
    
    // Count existing items to set order
    const itemCount = await GiftItem.countDocuments({ eventId });
    
    // Create the new item
    const giftItem = new GiftItem({
      ...req.body,
      eventId,
      order: itemCount + 1,
      // Ajoutez ce bloc
      imageUrl: req.file 
        ? req.file.filename 
        : req.body.imageUrl || null
    });
    
    await giftItem.save();
    
    res.status(201).json({
      success: true,
      data: giftItem
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all gift items for an event
 * @route GET /api/events/:eventId/gifts
 * @access Public (guests and organizer)
 */
exports.getAllGiftItems = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guestId, status } = req.query;
    
    // Check if event exists
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found'
      });
    }
    
    // Build base filter
    let filter = { eventId };
    
    // Retrieve items
    let giftItems = await GiftItem.find(filter)
      .sort({ isEssential: -1, order: 1 }) // Sort by essential then by order
      .populate({
        path: 'reservations.guestId',
        select: 'name email phone'
      });
    
    // Filter by status if needed
    if (status) {
      giftItems = giftItems.filter(item => item.status === status);
    }
    
    // If a guestId is provided, add a field to indicate if guest has reserved each gift
    if (guestId) {
      giftItems = giftItems.map(item => {
        const giftObj = item.toObject();
        giftObj.isReservedByCurrentGuest = item.isReservedByGuest(guestId);
        giftObj.currentGuestReservation = item.getGuestReservation(guestId);
        return giftObj;
      });
    }
    
    // Check if user is the organizer
    const isOrganizer = event.creator.toString() === (req.user ? req.user._id.toString() : '');
    
    // If not the organizer, limit reservation information
    if (!isOrganizer) {
      giftItems = giftItems.map(item => {
        const filteredItem = typeof item.toObject === 'function' ? item.toObject() : item;
        
        // Remove detailed reservation information for non-organizers
        if (filteredItem.reservations && filteredItem.reservations.length > 0) {
          filteredItem.reservations = filteredItem.reservations.map(res => ({
            quantity: res.quantity,
            // Keep only the first name for privacy
            guestName: res.guestId ? res.guestId.name.split(' ')[0] : 'A guest'
          }));
        }
        
        return filteredItem;
      });
    }
    
    res.status(200).json({
      success: true,
      count: giftItems.length,
      data: giftItems
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a specific gift item
 * @route GET /api/events/:eventId/gifts/:giftId
 * @access Public (guests and organizer)
 */
exports.getGiftItemById = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    const { guestId } = req.query;
    
    // Check if item exists and belongs to the event
    const giftItem = await GiftItem.findOne({ _id: giftId, eventId })
      .populate({
        path: 'reservations.guestId',
        select: 'name email phone'
      });
    
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }
    
    // Check if user is the organizer
    const event = await Event.findById(eventId);
    const isOrganizer = event.creator.toString() === (req.user ? req.user._id.toString() : '');
    
    let result = giftItem.toObject();
    
    // If a guestId is provided, add a field to indicate if guest has reserved this item
    if (guestId) {
      result.isReservedByCurrentGuest = giftItem.isReservedByGuest(guestId);
      result.currentGuestReservation = giftItem.getGuestReservation(guestId);
    }
    
    // If not the organizer, limit reservation information
    if (!isOrganizer) {
      if (result.reservations && result.reservations.length > 0) {
        result.reservations = result.reservations.map(res => ({
          quantity: res.quantity,
          // Keep only the first name for privacy
          guestName: res.guestId ? res.guestId.name.split(' ')[0] : 'A guest'
        }));
      }
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update a gift item
 * @route PUT /api/events/:eventId/gifts/:giftId
 * @access Private (organizer)
 */
exports.updateGiftItem = async (req, res) => {
  try {
    console.log('Received update data:', req.body);
    const { eventId, giftId } = req.params;

    // Vérifier si l'événement appartient à l'utilisateur
    const event = await Event.findOne({ _id: eventId, creator: req.user._id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or you do not have permission to access it' 
      });
    }
    
    // Conversion forcée pour les types
    const updateData = {
      name: req.body.name,
      description: req.body.description || '',
      quantity: parseInt(req.body.quantity, 10) || 1,
      isEssential: req.body.isEssential === 'true', // Conversion explicite
      imageUrl: req.file ? req.file.filename : req.body.imageUrl || null
    };
    // Valider les données
    /*const { error } = updateGiftItemSchema.validate(updateData);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }*/

    // Mettre à jour le cadeau
    const giftItem = await GiftItem.findOneAndUpdate(
      { _id: giftId, eventId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: giftItem
    });

  } catch (error) {
    console.error('Update error details:', error); // <-- Log complet
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete a gift item
 * @route DELETE /api/events/:eventId/gifts/:giftId
 * @access Private (organizer)
 */
exports.deleteGiftItem = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    
    // Check if event belongs to user
    const event = await Event.findOne({ _id: eventId, creator: req.user._id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or you do not have permission to access it' 
      });
    }
    
    // Delete the item
    const giftItem = await GiftItem.findOneAndDelete({ _id: giftId, eventId });
    
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }
    
    // Reorder remaining items
    await GiftItem.updateMany(
      { 
        eventId, 
        order: { $gt: giftItem.order } 
      },
      { $inc: { order: -1 } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Gift item successfully deleted'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Reserve a gift item
 * @route POST /api/events/:eventId/gifts/:giftId/assign
 * @access Public (identified guests)
 */
exports.assignGiftItem = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    const { guestId, quantity, message } = req.body;
    
    if (!guestId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'guestId and quantity parameters are required'
      });
    }
    
    // Check if guest exists and is associated with the event
// Vérifier si l'invité existe d'abord
    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    // Vérifier si l'invité est associé à l'événement via une invitation acceptée
    const invitation = await Invitation.findOne({ 
      event: eventId,
      guest: guestId,
      'response.status': 'yes'  // L'invité a accepté l'invitation
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Guest not associated with this event or has not accepted the invitation'
      });
    }
    // Check if item exists
    const giftItem = await GiftItem.findOne({ _id: giftId, eventId });
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }
    
    // Check if guest has already reserved this item
    const existingReservation = giftItem.getGuestReservation(guestId);
    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'You have already reserved this item'
      });
    }
    
    // Check if available quantity is sufficient
    if (giftItem.quantityReserved + parseInt(quantity) > giftItem.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available quantity'
      });
    }
    
    // Add reservation
    giftItem.reservations.push({
      guestId,
      quantity: parseInt(quantity),
      message: message || ''
    });
    
    await giftItem.save();
    
    // Get event information for notification
    const event = await Event.findById(eventId).populate('creator', 'email name');
    
    // Send notification to organizer
    try {
      await emailService.sendGiftReservationNotification(
        event.userId.email,
        {
          eventName: event.name,
          guestName: guest.name,
          giftName: giftItem.name,
          quantity,
          message: message || 'No message'
        }
      );
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't block response in case of email failure
    }
    
    res.status(200).json({
      success: true,
      message: 'Item successfully reserved',
      data: giftItem
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Cancel a gift item reservation
 * @route POST /api/events/:eventId/gifts/:giftId/unassign
 * @access Public (identified guests)
 */
exports.unassignGiftItem = async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    const { guestId } = req.body;
    
    if (!guestId) {
      return res.status(400).json({
        success: false,
        message: 'guestId parameter is required'
      });
    }
    
    // Check if guest exists and is associated with the event
    const guest = await Guest.findOne({ _id: guestId, eventId });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found or not associated with this event'
      });
    }
    
    // Check if item exists
    const giftItem = await GiftItem.findOne({ _id: giftId, eventId });
    if (!giftItem) {
      return res.status(404).json({
        success: false,
        message: 'Gift item not found'
      });
    }
    
    // Check if guest has reserved this item
    const existingReservationIndex = giftItem.reservations.findIndex(
      reservation => reservation.guestId.toString() === guestId
    );
    
    if (existingReservationIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You have not reserved this item'
      });
    }
    
    // Remove reservation
    giftItem.reservations.splice(existingReservationIndex, 1);
    
    await giftItem.save();
    
    // Get event information for notification
    const event = await Event.findById(eventId).populate('creator', 'email name');
    
    // Send notification to organizer
    try {
      await emailService.sendGiftCancellationNotification(
        event.userId.email,
        {
          eventName: event.name,
          guestName: guest.name,
          giftName: giftItem.name
        }
      );
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't block response in case of email failure
    }
    
    res.status(200).json({
      success: true,
      message: 'Reservation successfully canceled',
      data: giftItem
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Reorder gift items
 * @route PUT /api/events/:eventId/gifts/reorder
 * @access Private (organizer)
 */
exports.reorderGiftItems = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'items must be an array of objects {id, order}'
      });
    }
    
    // Check if event belongs to user
    const event = await Event.findOne({ _id: eventId, creator: req.user._id });
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found or you do not have permission to access it' 
      });
    }
    
    // Update order of each item
    const updatePromises = items.map(item => {
      return GiftItem.updateOne(
        { _id: item.id, eventId },
        { order: item.order }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'Item order successfully updated'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a guest's reservations
 * @route GET /api/events/:eventId/gifts/reservations/:guestId
 * @access Public (concerned guest)
 */
exports.getGuestReservations = async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    
    // Check if guest exists and is associated with the event
    const guest = await Guest.findOne({ _id: guestId, eventId });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found or not associated with this event'
      });
    }
    
    // Find all items reserved by this guest
    const giftItems = await GiftItem.find({
      eventId,
      'reservations.guestId': guestId
    });
    
    // Format response
    const reservations = giftItems.map(item => {
      const reservation = item.getGuestReservation(guestId);
      return {
        giftId: item._id,
        giftName: item.name,
        quantity: reservation.quantity,
        message: reservation.message,
        createdAt: reservation.createdAt,
        totalQuantity: item.quantity,
        quantityReserved: item.quantityReserved,
        imageUrl: item.imageUrl
      };
    });
    
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};