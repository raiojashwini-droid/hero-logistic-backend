
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./src/routes/index');
const errorHandler = require('./src/middlewares/errorHandler');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const path = require('path');

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', cors(), express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

const { analyticsLogger } = require('./src/middleware/analyticsLogger');

// Base API routes
app.use(analyticsLogger);
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hero Logistics Backend API is running', status: 'OK' });
});

// Global Error handling middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  try {
    const syncMissingVehicleColumns = require('./src/utils/syncDbColumns');
    await syncMissingVehicleColumns();
  } catch (err) {
    console.warn('Startup DB column sync notice:', err.message);
  }
});

