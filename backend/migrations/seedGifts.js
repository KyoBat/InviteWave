const mongoose = require('mongoose');
const GiftItem = require('../models/giftItem'); // Assurez-vous que le chemin est correct
const config = require('../config'); // Importez la configuration

// Connexion à la base de données
mongoose.connect(config.db.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const eventId = '67d15b7e8bd0dbf207d97584'; // ID de l'événement

const giftItems = [
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
];

const seedGifts = async () => {
  try {
    // Optionnel: supprimer les cadeaux existants pour cet événement
    await GiftItem.deleteMany({ eventId });
    console.log('Existing gifts cleared');

    // Ajouter les nouveaux cadeaux
    const result = await GiftItem.insertMany(giftItems);
    console.log(`${result.length} gift items inserted successfully`);
    
    // Fermer la connexion à la base de données
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding gift items:', error);
    mongoose.connection.close();
  }
};

seedGifts();