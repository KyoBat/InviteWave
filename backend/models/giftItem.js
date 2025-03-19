const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const giftItemSchema = new Schema({
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
    required: true,
    min: 1
  },
 // quantityReserved: {
 //   type: Number,
 //   default: 0
  //},
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
      trim: true,
      default: ''
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

// Définition de la propriété virtuelle quantityReserved
giftItemSchema.virtual('quantityReserved').get(function() {
  return this.reservations.reduce((total, res) => total + res.quantity, 0);
});

// Définition de la propriété virtuelle status
giftItemSchema.virtual('status').get(function() {
  const reserved = this.quantityReserved;
  if (reserved === 0) return 'available';
  if (reserved < this.quantity) return 'partially';
  return 'reserved';
});

// Définition de la propriété virtuelle reservationPercentage
giftItemSchema.virtual('reservationPercentage').get(function() {
  return Math.min(100, Math.round((this.quantityReserved / this.quantity) * 100));
});

// Méthode pour vérifier si un invité a réservé cet élément
giftItemSchema.methods.isReservedByGuest = function(guestId) {
  return this.reservations.some(res => res.guestId && res.guestId.toString() === guestId.toString());
};

// Méthode pour obtenir la réservation d'un invité
giftItemSchema.methods.getGuestReservation = function(guestId) {
  return this.reservations.find(res => res.guestId && res.guestId.toString() === guestId.toString());
};

// Options pour que les virtuals soient inclus lors de la conversion en JSON
giftItemSchema.set('toJSON', { virtuals: true });
giftItemSchema.set('toObject', { virtuals: true });

const GiftItem = mongoose.model('GiftItem', giftItemSchema);
module.exports = GiftItem;