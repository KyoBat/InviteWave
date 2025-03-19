// backend/tests/unit/giftItemController.unit.test.js
const mongoose = require('mongoose');
const { giftItemController } = require('../../controllers');
const { GiftItem, Event, Guest } = require('../../models');
const { emailService } = require('../../services');

// Mock des modèles et services
jest.mock('../../models/giftItem');
jest.mock('../../models/events');
jest.mock('../../models/guest');
jest.mock('../../services/emailService');

// Mock données
const mockUserId = new mongoose.Types.ObjectId();
const mockEventId = new mongoose.Types.ObjectId();
const mockGiftId = new mongoose.Types.ObjectId();
const mockGuestId = new mongoose.Types.ObjectId();

describe('GiftItem Controller Unit Tests', () => {
  // Réinitialiser les mocks entre les tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGiftItem', () => {
    it('should create a gift item successfully', async () => {
      // Mock des données de requête
      const req = {
        params: { eventId: mockEventId },
        body: {
          name: 'Test Gift',
          description: 'Test Description',
          quantity: 2,
          isEssential: true
        },
        user: { id: mockUserId }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock des réponses de base de données
      Event.findOne.mockResolvedValue({ _id: mockEventId, userId: mockUserId });
      GiftItem.countDocuments.mockResolvedValue(5); // 5 cadeaux existants
      
      const saveMock = jest.fn().mockResolvedValue({
        _id: mockGiftId,
        ...req.body,
        eventId: mockEventId,
        order: 6 // 5 + 1
      });
      
      GiftItem.mockImplementation(() => ({
        save: saveMock
      }));

      // Exécuter la fonction
      await giftItemController.createGiftItem(req, res);

      // Vérifier les résultats
      expect(Event.findOne).toHaveBeenCalledWith({ _id: mockEventId, userId: mockUserId });
      expect(GiftItem.countDocuments).toHaveBeenCalledWith({ eventId: mockEventId });
      expect(GiftItem).toHaveBeenCalledWith({
        ...req.body,
        eventId: mockEventId,
        order: 6
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: mockGiftId,
          name: req.body.name,
          eventId: mockEventId
        })
      });
    });

    it('should return 404 if event does not exist or user is not owner', async () => {
      const req = {
        params: { eventId: mockEventId },
        body: { name: 'Test Gift' },
        user: { id: mockUserId }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // L'événement n'existe pas ou n'appartient pas à l'utilisateur
      Event.findOne.mockResolvedValue(null);

      await giftItemController.createGiftItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String)
      });
    });
  });

  describe('getAllGiftItems', () => {
    it('should return all gift items with correct filters', async () => {
      const req = {
        params: { eventId: mockEventId },
        query: { status: 'available', guestId: mockGuestId },
        user: { id: mockUserId }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock des réponses
      Event.findById.mockResolvedValue({ _id: mockEventId, userId: mockUserId });
      
      const mockGiftItems = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Gift 1',
          status: 'available',
          isReservedByGuest: jest.fn().mockReturnValue(false),
          getGuestReservation: jest.fn().mockReturnValue(null),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            name: 'Gift 1',
            status: 'available',
            reservations: []
          })
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Gift 2',
          status: 'partially',
          isReservedByGuest: jest.fn().mockReturnValue(true),
          getGuestReservation: jest.fn().mockReturnValue({
            quantity: 1,
            message: 'Test message'
          }),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            name: 'Gift 2',
            status: 'partially',
            reservations: [
              { guestId: { name: 'Guest Name' }, quantity: 1 }
            ]
          })
        }
      ];

      GiftItem.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockGiftItems)
      });

      await giftItemController.getAllGiftItems(req, res);

      expect(Event.findById).toHaveBeenCalledWith(mockEventId);
      expect(GiftItem.find).toHaveBeenCalledWith({ eventId: mockEventId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: expect.any(Number),
        data: expect.any(Array)
      });
    });
  });

  describe('assignGiftItem', () => {
    it('should assign a gift item to a guest', async () => {
      const req = {
        params: { eventId: mockEventId, giftId: mockGiftId },
        body: {
          guestId: mockGuestId,
          quantity: 1,
          message: 'Test message'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock des réponses
      Guest.findOne.mockResolvedValue({
        _id: mockGuestId,
        name: 'Test Guest'
      });

      const mockGiftItem = {
        _id: mockGiftId,
        name: 'Test Gift',
        quantity: 3,
        quantityReserved: 1,
        reservations: [],
        getGuestReservation: jest.fn().mockReturnValue(null),
        save: jest.fn().mockResolvedValue({
          _id: mockGiftId,
          name: 'Test Gift',
          reservations: [
            {
              guestId: mockGuestId,
              quantity: 1,
              message: 'Test message'
            }
          ]
        })
      };

      GiftItem.findOne.mockResolvedValue(mockGiftItem);
      
      Event.findById.mockResolvedValue({
        _id: mockEventId,
        name: 'Test Event',
        userId: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      emailService.sendGiftReservationNotification.mockResolvedValue(true);

      await giftItemController.assignGiftItem(req, res);

      expect(Guest.findOne).toHaveBeenCalledWith({ _id: mockGuestId, eventId: mockEventId });
      expect(GiftItem.findOne).toHaveBeenCalledWith({ _id: mockGiftId, eventId: mockEventId });
      expect(mockGiftItem.getGuestReservation).toHaveBeenCalledWith(mockGuestId);
      expect(mockGiftItem.save).toHaveBeenCalled();
      expect(emailService.sendGiftReservationNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: expect.any(Object)
      });
    });

    it('should return 400 if guest has already reserved the item', async () => {
      const req = {
        params: { eventId: mockEventId, giftId: mockGiftId },
        body: {
          guestId: mockGuestId,
          quantity: 1
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Guest.findOne.mockResolvedValue({ _id: mockGuestId });
      
      const mockGiftItem = {
        _id: mockGiftId,
        getGuestReservation: jest.fn().mockReturnValue({
          guestId: mockGuestId,
          quantity: 1
        })
      };

      GiftItem.findOne.mockResolvedValue(mockGiftItem);

      await giftItemController.assignGiftItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String)
      });
    });

    it('should return 400 if requested quantity exceeds available quantity', async () => {
      const req = {
        params: { eventId: mockEventId, giftId: mockGiftId },
        body: {
          guestId: mockGuestId,
          quantity: 3 // Plus que la quantité disponible
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Guest.findOne.mockResolvedValue({ _id: mockGuestId });
      
      const mockGiftItem = {
        _id: mockGiftId,
        quantity: 2,
        quantityReserved: 0,
        getGuestReservation: jest.fn().mockReturnValue(null)
      };

      GiftItem.findOne.mockResolvedValue(mockGiftItem);

      await giftItemController.assignGiftItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String)
      });
    });
  });

  describe('unassignGiftItem', () => {
    it('should remove a guest reservation successfully', async () => {
      const req = {
        params: { eventId: mockEventId, giftId: mockGiftId },
        body: { guestId: mockGuestId }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Guest.findOne.mockResolvedValue({
        _id: mockGuestId,
        name: 'Test Guest'
      });

      const mockGiftItem = {
        _id: mockGiftId,
        name: 'Test Gift',
        reservations: [
          {
            guestId: mockGuestId,
            quantity: 1
          }
        ],
        save: jest.fn().mockResolvedValue({
          _id: mockGiftId,
          name: 'Test Gift',
          reservations: []
        })
      };

      GiftItem.findOne.mockResolvedValue(mockGiftItem);
      
      Event.findById.mockResolvedValue({
        _id: mockEventId,
        name: 'Test Event',
        userId: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      emailService.sendGiftCancellationNotification.mockResolvedValue(true);

      await giftItemController.unassignGiftItem(req, res);

      expect(mockGiftItem.save).toHaveBeenCalled();
      expect(emailService.sendGiftCancellationNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: expect.any(Object)
      });
    });

    it('should return 400 if guest has not reserved the item', async () => {
      const req = {
        params: { eventId: mockEventId, giftId: mockGiftId },
        body: { guestId: mockGuestId }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      Guest.findOne.mockResolvedValue({ _id: mockGuestId });
      
      // Pas de réservation pour cet invité
      const mockGiftItem = {
        _id: mockGiftId,
        reservations: []
      };

      GiftItem.findOne.mockResolvedValue(mockGiftItem);

      await giftItemController.unassignGiftItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String)
      });
    });
  });

  // Vous pouvez ajouter des tests similaires pour les autres méthodes du contrôleur
});