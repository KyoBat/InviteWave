const request = require('supertest');
const app = require('../app'); // Assurez-vous que le chemin est correct
const mongoose = require('mongoose');
const GiftItem = require('../models/giftItem');
const Event = require('../models/events');
const User = require('../models/user');

describe('Gift Item API', () => {
  let token;
  let eventId;
  let userId;

  beforeAll(async () => {
    // Connect to the database
    await mongoose.connect('mongodb+srv://boulothibou:Mariagecub31+@wedding.axpo5.mongodb.net/?retryWrites=true&w=majority&appName=Wedding', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a user and get a token
    const user = new User({ name: 'Test User', email: 'test@example.com', password: 'password' });
    await user.save();
    userId = user._id;
    token = user.generateAuthToken();

    // Create an event
    const event = new Event({
      name: 'Test Event',
      creator: userId,
      date: new Date(),
      location: {
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      }
    });
    await event.save();
    eventId = event._id;
  });

  afterAll(async () => {
    // Clean up the database
    await User.deleteMany({});
    await Event.deleteMany({});
    await GiftItem.deleteMany({});
    await mongoose.connection.close();
  });

  it('should get all gift items for an event', async () => {
    // Create some gift items
    await GiftItem.insertMany([
      {
        eventId,
        name: "Robot Aspirateur",
        description: "Pour nous aider avec le ménage dans notre nouvelle maison",
        quantity: 1,
        isEssential: true,
        imageUrl: "https://example.com/images/vacuum.jpg"
      },
      {
        eventId,
        name: "Ensemble de Casseroles",
        description: "Ensemble de casseroles en inox de qualité professionnelle",
        quantity: 1,
        isEssential: true,
        imageUrl: "https://example.com/images/pots.jpg"
      },
      {
        eventId,
        name: "Machine à café",
        description: "Pour nos matins difficiles",
        quantity: 1,
        isEssential: false,
        imageUrl: "https://example.com/images/coffee-machine.jpg"
      }
    ]);

    const response = await request(app)
      .get(`/events/${eventId}/gifts`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(3);
    expect(response.body.data[0].name).toBe('Robot Aspirateur');
    expect(response.body.data[1].name).toBe('Ensemble de Casseroles');
    expect(response.body.data[2].name).toBe('Machine à café');
  });
});