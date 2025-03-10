// controllers/guestController.js
const { Guest } = require('../models');

// Get all guests for current user
exports.getGuests = async (req, res) => {
  try {
    const guests = await Guest.find({ createdBy: req.user._id });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch guests', error: error.message });
  }
};

// Create a new guest
exports.createGuest = async (req, res) => {
  try {
    const { name, email, phone, category } = req.body;
    
    // Validate that either email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({ message: 'Either email or phone is required' });
    }

    const guest = new Guest({
      name,
      email,
      phone,
      category,
      createdBy: req.user._id
    });

    await guest.save();
    res.status(201).json({ message: 'Guest created successfully', guest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create guest', error: error.message });
  }
};

// Get guest by ID
exports.getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findOne({ 
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json(guest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch guest', error: error.message });
  }
};

// Update a guest
exports.updateGuest = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'phone', 'category'];
    
    // Check if updates are valid
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    // Find and update guest
    const guest = await Guest.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Apply updates
    updates.forEach(update => guest[update] = req.body[update]);
    
    // Validate that either email or phone is provided
    if (!guest.email && !guest.phone) {
      return res.status(400).json({ message: 'Either email or phone is required' });
    }

    await guest.save();
    res.json({ message: 'Guest updated successfully', guest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update guest', error: error.message });
  }
};

// Delete a guest
exports.deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete guest', error: error.message });
  }
};

// Import multiple guests
exports.importGuests = async (req, res) => {
  try {
    const { guests } = req.body;
    
    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ message: 'Valid guests array is required' });
    }

    // Validate each guest
    const validGuests = guests.filter(guest => {
      return guest.name && (guest.email || guest.phone);
    });

    if (validGuests.length === 0) {
      return res.status(400).json({ message: 'No valid guests found in import data' });
    }

    // Add createdBy to each guest
    const guestsToCreate = validGuests.map(guest => ({
      ...guest,
      createdBy: req.user._id
    }));

    // Bulk create guests
    const createdGuests = await Guest.insertMany(guestsToCreate);

    res.status(201).json({
      message: `Successfully imported ${createdGuests.length} guests`,
      guests: createdGuests
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to import guests', error: error.message });
  }
};