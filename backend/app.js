// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error');
const bodyParser = require('body-parser');
const giftItemRoutes = require('./routes/giftItem');


// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(config.db.uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.app.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body
app.use(morgan(config.app.env === 'development' ? 'dev' : 'combined')); // Logging

// Serve static files
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Assurez-vous que le chemin est correct :
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//app.use('/uploads', express.static('uploads'));
//app.use('/api/events', giftItemRoutes);
// Augmenter la limite de taille du corps de la requête
app.use(bodyParser.json({ limit: '10mb' })); // Limite à 10 Mo
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // Limite à 10 Mo
// API routes
app.use('/api', routes);


// Error handling
app.use(errorHandler);

// Start server
const PORT = config.app.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;