const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pigsRoutes = require('./routes/pigs');
const breedingRoutes = require('./routes/breeding');
const vaccinationRoutes = require('./routes/vaccinations');
const treatmentRoutes = require('./routes/treatments');
const weightRoutes = require('./routes/weights');
const salesRoutes = require('./routes/sales');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');

const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/pigs', authMiddleware, pigsRoutes);
app.use('/api/breeding', authMiddleware, breedingRoutes);
app.use('/api/vaccinations', authMiddleware, vaccinationRoutes);
app.use('/api/treatments', authMiddleware, treatmentRoutes);
app.use('/api/weights', authMiddleware, weightRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Pig Farm Management API running on port ${PORT}`);
});

module.exports = app;
