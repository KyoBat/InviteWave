// models/invitation.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true
  },
  uniqueCode: {
    type: String,
    unique: true
  },
  sendMethod: {
    type: String,
    enum: ['whatsapp', 'email', 'both'],
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  response: {
    status: {
      type: String,
      enum: ['yes', 'no', 'maybe', 'pending'],
      default: 'pending'
    },
    message: {
      type: String,
      trim: true
    },
    respondedAt: Date
  },
  sentAt: Date
}, {
  timestamps: true
});

// Generate unique code before saving if not provided
invitationSchema.pre('save', function(next) {
  if (!this.uniqueCode) {
    this.uniqueCode = crypto.randomBytes(6).toString('hex');
  }
  next();
});

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;