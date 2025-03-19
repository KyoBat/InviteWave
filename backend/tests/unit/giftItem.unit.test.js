// backend/tests/unit/giftItem.unit.test.js
const mongoose = require('mongoose');
const { GiftItem } = require('../../models');

// Mock des données
const mockEventId = new mongoose.Types.ObjectId();
const mockGuestId1 = new mongoose.Types.ObjectId();
const mockGuestId2 = new mongoose.Types.ObjectId();

describe('GiftItem Model Unit Tests', () => {
  // Réinitialiser les mocks entre les tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Validation', () => {
    it('should validate a valid gift item', async () => {
      const validGiftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        description: 'Test Description',
        quantity: 2,
        imageUrl: 'http://example.com/image.jpg',
        isEssential: true
      });

      const validateResult = validGiftItem.validateSync();
      expect(validateResult).toBeUndefined();
    });

    it('should require name field', async () => {
      const invalidGiftItem = new GiftItem({
        eventId: mockEventId,
        description: 'Test Description',
        quantity: 2
      });

      const validateResult = invalidGiftItem.validateSync();
      expect(validateResult.errors.name).toBeDefined();
      expect(validateResult.errors.name.kind).toBe('required');
    });

    it('should require eventId field', async () => {
      const invalidGiftItem = new GiftItem({
        name: 'Test Gift',
        description: 'Test Description',
        quantity: 2
      });

      const validateResult = invalidGiftItem.validateSync();
      expect(validateResult.errors.eventId).toBeDefined();
      expect(validateResult.errors.eventId.kind).toBe('required');
    });

    it('should not allow quantity less than 1', async () => {
      const invalidGiftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        description: 'Test Description',
        quantity: 0
      });

      const validateResult = invalidGiftItem.validateSync();
      expect(validateResult.errors.quantity).toBeDefined();
      expect(validateResult.errors.quantity.kind).toBe('min');
    });
  });

  describe('Virtual Fields', () => {
    it('should return status "available" when no reservations', () => {
      const giftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        quantity: 2,
        reservations: []
      });

      expect(giftItem.status).toBe('available');
      expect(giftItem.reservationPercentage).toBe(0);
    });

    it('should return status "partially" when some items are reserved', () => {
      const giftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        quantity: 3,
        reservations: [
          {
            guestId: mockGuestId1,
            quantity: 1,
            message: 'I will bring one'
          }
        ]
      });

      // Recalculer manuellement la quantité réservée (normalement fait par le middleware pre-save)
      giftItem.quantityReserved = giftItem.reservations.reduce((total, res) => total + res.quantity, 0);

      expect(giftItem.status).toBe('partially');
      expect(giftItem.reservationPercentage).toBe(33); // 1/3 = 33%
    });

    it('should return status "reserved" when all items are reserved', () => {
      const giftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        quantity: 2,
        reservations: [
          {
            guestId: mockGuestId1,
            quantity: 1,
            message: 'I will bring one'
          },
          {
            guestId: mockGuestId2,
            quantity: 1,
            message: 'I will bring another one'
          }
        ]
      });

      // Recalculer manuellement la quantité réservée
      giftItem.quantityReserved = giftItem.reservations.reduce((total, res) => total + res.quantity, 0);

      expect(giftItem.status).toBe('reserved');
      expect(giftItem.reservationPercentage).toBe(100); // 2/2 = 100%
    });

    it('should cap reservationPercentage at 100% even if over-reserved', () => {
      const giftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        quantity: 1,
        reservations: [
          {
            guestId: mockGuestId1,
            quantity: 2, // Réserver plus que la quantité disponible
            message: 'I will bring two'
          }
        ]
      });

      // Recalculer manuellement la quantité réservée
      giftItem.quantityReserved = giftItem.reservations.reduce((total, res) => total + res.quantity, 0);

      expect(giftItem.status).toBe('reserved');
      expect(giftItem.reservationPercentage).toBe(100); // Plafonné à 100%
    });
  });

  describe('Helper Methods', () => {
    let giftItem;

    beforeEach(() => {
      giftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        quantity: 3,
        reservations: [
          {
            guestId: mockGuestId1,
            quantity: 1,
            message: 'I will bring one'
          }
        ]
      });
    });

    it('should correctly identify if guest has reserved the item', () => {
      // L'invité 1 a réservé l'article
      expect(giftItem.isReservedByGuest(mockGuestId1)).toBe(true);
      
      // L'invité 2 n'a pas réservé l'article
      expect(giftItem.isReservedByGuest(mockGuestId2)).toBe(false);
    });

    it('should return the reservation for a specific guest', () => {
      // Obtenir la réservation de l'invité 1
      const reservation = giftItem.getGuestReservation(mockGuestId1);
      expect(reservation).toBeDefined();
      expect(reservation.guestId).toEqual(mockGuestId1);
      expect(reservation.quantity).toBe(1);
      expect(reservation.message).toBe('I will bring one');
      
      // L'invité 2 n'a pas de réservation
      expect(giftItem.getGuestReservation(mockGuestId2)).toBeUndefined();
    });
  });

  describe('Pre-save Middleware', () => {
    it('should update quantityReserved based on reservations', async () => {
      const giftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        quantity: 5,
        reservations: [
          { guestId: mockGuestId1, quantity: 2 },
          { guestId: mockGuestId2, quantity: 1 }
        ]
      });

      // Simuler l'exécution du middleware pre-save
      const next = jest.fn();
      await giftItem.schema.pre('save').exec.call(giftItem, next);

      expect(giftItem.quantityReserved).toBe(3); // 2 + 1 = 3
      expect(next).toHaveBeenCalled();
    });

    it('should update updatedAt timestamp', async () => {
      const now = new Date();
      jest.spyOn(Date, 'now').mockImplementation(() => now);

      const giftItem = new GiftItem({
        eventId: mockEventId,
        name: 'Test Gift',
        quantity: 2
      });

      // Simuler l'exécution du middleware pre-save
      const next = jest.fn();
      await giftItem.schema.pre('save').exec.call(giftItem, next);

      expect(giftItem.updatedAt).toEqual(now);
      expect(next).toHaveBeenCalled();

      Date.now.mockRestore();
    });
  });
});