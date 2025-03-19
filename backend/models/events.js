// models/event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  theme: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Automatically update status based on date
eventSchema.pre('save', function(next) {
  const now = new Date();
  if (this.date < now && this.status === 'active') {
    this.status = 'completed';
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;