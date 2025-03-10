// backend/models/giftItem.js
const mongoose = require('mongoose');

const giftItemSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
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
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  quantityReserved: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String
  },
  isEssential: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  reservations: [{
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    message: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour le champ updatedAt avant chaque sauvegarde
giftItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Recalculer quantityReserved en fonction des réservations
  this.quantityReserved = this.reservations.reduce((total, reservation) => {
    return total + reservation.quantity;
  }, 0);
  
  next();
});

// Méthode virtuelle pour obtenir l'état de réservation
giftItemSchema.virtual('status').get(function() {
  if (this.quantityReserved === 0) {
    return 'available';
  } else if (this.quantityReserved >= this.quantity) {
    return 'reserved';
  } else {
    return 'partially';
  }
});

// Méthode virtuelle pour obtenir le pourcentage de réservation
giftItemSchema.virtual('reservationPercentage').get(function() {
  return Math.min(100, Math.round((this.quantityReserved / this.quantity) * 100));
});

// Méthode pour vérifier si un invité a déjà réservé cet objet
giftItemSchema.methods.isReservedByGuest = function(guestId) {
  return this.reservations.some(reservation => 
    reservation.guestId.toString() === guestId.toString()
  );
};

// Méthode pour obtenir la réservation d'un invité spécifique
giftItemSchema.methods.getGuestReservation = function(guestId) {
  return this.reservations.find(reservation => 
    reservation.guestId.toString() === guestId.toString()
  );
};

// Configuration pour que les virtuals soient inclus lors de la conversion en JSON
giftItemSchema.set('toJSON', { virtuals: true });
giftItemSchema.set('toObject', { virtuals: true });

const GiftItem = mongoose.model('GiftItem', giftItemSchema);

module.exports = GiftItem;