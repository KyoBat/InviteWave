// routes/user.js
const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { auth, validation, upload } = require('../middlewares');
const Joi = require('joi');

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  phone: Joi.string().allow('', null),
  profilePicture: Joi.string().allow('', null)
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Routes
router.get('/me', auth.auth, userController.getProfile);
router.put('/me', auth.auth, validation.validateBody(updateProfileSchema), userController.updateProfile);
router.put('/me/password', auth.auth, validation.validateBody(updatePasswordSchema), userController.updatePassword);

// Upload profile picture
router.post('/me/upload-profile-picture', auth.auth, upload.upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;