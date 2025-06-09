const express = require('express');
const cors = require('cors');      // Import once at the top
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Enable CORS before routes
app.use(cors({ origin: 'http://localhost:3000' }));

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
const urlRoutes = require('./routes/urlRoutes');

// Mount API route for shortening URLs
app.use('/api', urlRoutes);

// Mount the redirect route at root
app.use('/', urlRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
