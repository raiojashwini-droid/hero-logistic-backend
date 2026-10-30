
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

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'bypass-tunnel-reminder',
    'x-requested-with',
    'Accept',
    'x-company-id',
    'x-tenant-id',
    'X-Company-Id',
    'X-Tenant-Id'
  ]
};
app.use(cors(corsOptions));
app.options(/.*$/, cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', cors(), express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

const { analyticsLogger } = require('./src/middleware/analyticsLogger');

// Base API routes
app.use(analyticsLogger);
app.use('/api/v1/warehouse-inventory', require('./src/routes/WarehouseInventoryRoutes'));
app.use('/api/warehouse-inventory', require('./src/routes/WarehouseInventoryRoutes'));
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);


// Health check and demo sync endpoints
app.get('/', (req, res) => {
  res.json({ message: 'Hero Logistics Backend API is running', status: 'OK', version: '2026-10-30-demo-sync-v1' });
});

app.all('/api/v1/auth/ensure-demo', async (req, res) => {
  try {
    const ensureDemoUsers = require('./src/utils/seedDemoUsers');
    await ensureDemoUsers();
    res.json({ success: true, message: 'All 9 demo portal accounts synchronized' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
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
  try {
    const ensureDemoUsers = require('./src/utils/seedDemoUsers');
    await ensureDemoUsers();
  } catch (err) {
    console.warn('Startup Demo users sync notice:', err.message);
  }
});

