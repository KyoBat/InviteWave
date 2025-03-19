// tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const mongoose = require('mongoose');

// Configuration de la base de données de test
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/event-planner-test';
  await mongoose.connect(mongoUri);
});

// Nettoyage après les tests
afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Authentication Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '123-456-7890'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toEqual('test@example.com');
  });

  it('should login a user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toEqual(401);
  });
});