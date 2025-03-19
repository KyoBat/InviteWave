// controllers/userController.js
const { User } = require('../models');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'phone', 'profilePicture'];
    
    // Check if updates are valid
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    // Apply updates
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();

    res.json({ message: 'Profile updated successfully', user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
};