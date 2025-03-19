// tests/events.test.js
const request = require('supertest');
const app = require('../app');
const { User, Event } = require('../models');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');

let token;
let userId;
let eventId;

// Configuration de la base de données de test
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/event-planner-test';
  await mongoose.connect(mongoUri);
  
  // Créer un utilisateur de test
  const user = new User({
    name: 'Event Test User',
    email: 'eventtest@example.com',
    password: 'password123'
  });
  
  await user.save();
  userId = user._id;
  
  // Générer un token
  token = jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry
  });
});

// Nettoyage après les tests
afterAll(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  await mongoose.connection.close();
});

describe('Event Endpoints', () => {
  it('should create a new event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Event',
        description: 'This is a test event',
        date: new Date().toISOString(),
        location: {
          address: '123 Test St, Test City',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        theme: 'Test Theme'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('event');
    expect(res.body.event.name).toEqual('Test Event');
    
    eventId = res.body.event._id;
  });

  it('should get all events for a user', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a specific event', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id', eventId);
    expect(res.body.name).toEqual('Test Event');
  });

  it('should update an event', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Test Event',
        theme: 'Updated Theme'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('event');
    expect(res.body.event.name).toEqual('Updated Test Event');
    expect(res.body.event.theme).toEqual('Updated Theme');
  });

  it('should delete an event', async () => {
    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    
    // Vérifier que l'événement a bien été supprimé
    const checkEvent = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(checkEvent.statusCode).toEqual(404);
  });
});