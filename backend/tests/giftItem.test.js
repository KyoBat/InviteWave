// backend/tests/giftItem.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Event, Guest, GiftItem } = require('../models');
const { generateToken } = require('../utils/auth');

let testUser;
let testEvent;
let testGuest;
let testGiftItem;
let authToken;

beforeAll(async () => {
  // Connecter à la base de données de test
  await mongoose.connect(process.env.MONGO_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Nettoyer les collections avant les tests
  await User.deleteMany({});
  await Event.deleteMany({});
  await Guest.deleteMany({});
  await GiftItem.deleteMany({});
  
  // Créer un utilisateur de test
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  // Générer un token d'authentification
  authToken = generateToken(testUser);
  
  // Créer un événement de test
  testEvent = await Event.create({
    name: 'Test Event',
    date: new Date('2025-01-01'),
    location: 'Test Location',
    description: 'Test Description',
    userId: testUser._id
  });
  
  // Créer un invité de test
  testGuest = await Guest.create({
    name: 'Test Guest',
    email: 'guest@example.com',
    phone: '1234567890',
    eventId: testEvent._id,
    category: 'family'
  });
});

afterAll(async () => {
  // Déconnecter de la base de données après les tests
  await mongoose.connection.close();
});

describe('GiftItem API Tests', () => {
  describe('POST /api/events/:eventId/gifts', () => {
    it('should create a new gift item', async () => {
      const giftItemData = {
        name: 'Test Gift',
        description: 'Test Description',
        quantity: 2,
        isEssential: true
      };
      
      const response = await request(app)
        .post(`/api/events/${testEvent._id}/gifts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(giftItemData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(giftItemData.name);
      expect(response.body.data.isEssential).toBe(true);
      
      // Sauvegarder l'ID pour les tests suivants
      testGiftItem = response.body.data;
    });
    
    it('should not create a gift item with invalid data', async () => {
      const invalidData = {
        // Nom manquant
        description: 'Test Description',
        quantity: -1 // Valeur invalide
      };
      
      const response = await request(app)
        .post(`/api/events/${testEvent._id}/gifts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/events/:eventId/gifts', () => {
    it('should get all gift items for an event', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent._id}/gifts`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
    
    it('should filter gift items by status', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent._id}/gifts?status=available`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Tous les éléments retournés doivent avoir le statut 'available'
      response.body.data.forEach(item => {
        expect(item.status).toBe('available');
      });
    });
  });
  
  describe('GET /api/events/:eventId/gifts/:giftId', () => {
    it('should get a specific gift item', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testGiftItem._id);
      expect(response.body.data.name).toBe(testGiftItem.name);
    });
    
    it('should return 404 for non-existent gift item', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/events/${testEvent._id}/gifts/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('PUT /api/events/:eventId/gifts/:giftId', () => {
    it('should update a gift item', async () => {
      const updateData = {
        name: 'Updated Gift Name',
        description: 'Updated Description',
        isEssential: false
      };
      
      const response = await request(app)
        .put(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.isEssential).toBe(updateData.isEssential);
    });
  });
  
  describe('POST /api/events/:eventId/gifts/:giftId/assign', () => {
    it('should assign a gift item to a guest', async () => {
      const assignData = {
        guestId: testGuest._id,
        quantity: 1,
        message: 'I will bring this'
      };
      
      const response = await request(app)
        .post(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}/assign`)
        .send(assignData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservations.length).toBe(1);
      expect(response.body.data.reservations[0].guestId.toString()).toBe(testGuest._id.toString());
      expect(response.body.data.reservations[0].quantity).toBe(assignData.quantity);
      expect(response.body.data.reservations[0].message).toBe(assignData.message);
    });
    
    it('should not allow assigning more than available quantity', async () => {
      const assignData = {
        guestId: testGuest._id,
        quantity: 10 // Plus que la quantité disponible
      };
      
      const response = await request(app)
        .post(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}/assign`)
        .send(assignData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/events/:eventId/gifts/:giftId/unassign', () => {
    it('should unassign a gift item from a guest', async () => {
      const unassignData = {
        guestId: testGuest._id
      };
      
      const response = await request(app)
        .post(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}/unassign`)
        .send(unassignData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservations.length).toBe(0);
    });
    
    it('should return error if guest has not reserved the item', async () => {
      const unassignData = {
        guestId: testGuest._id
      };
      
      const response = await request(app)
        .post(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}/unassign`)
        .send(unassignData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/events/:eventId/gifts/reservations/:guestId', () => {
    it('should get all reservations for a guest', async () => {
      // D'abord, réservons à nouveau un cadeau
      await request(app)
        .post(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}/assign`)
        .send({
          guestId: testGuest._id,
          quantity: 1
        });
      
      const response = await request(app)
        .get(`/api/events/${testEvent._id}/gifts/reservations/${testGuest._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].giftId).toBe(testGiftItem._id.toString());
    });
  });
  
  describe('DELETE /api/events/:eventId/gifts/:giftId', () => {
    it('should delete a gift item', async () => {
      const response = await request(app)
        .delete(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Vérifier que l'élément a bien été supprimé
      const checkResponse = await request(app)
        .get(`/api/events/${testEvent._id}/gifts/${testGiftItem._id}`);
      
      expect(checkResponse.status).toBe(404);
    });
  });
});