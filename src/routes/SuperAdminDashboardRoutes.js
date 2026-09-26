const express = require('express');
const router = express.Router();
const SuperAdminDashboardController = require('../controllers/SuperAdminDashboardController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, (req, res, next) => {
  const url = req.baseUrl || req.originalUrl || req.path || '';
  if (url.includes('system-analytics') || url.includes('analytics')) {
    return SuperAdminDashboardController.getSystemAnalytics(req, res, next);
  }
  return SuperAdminDashboardController.getDashboardMetrics(req, res, next);
});

router.get('/system-analytics', verifyToken, SuperAdminDashboardController.getSystemAnalytics);
router.get('/analytics', verifyToken, SuperAdminDashboardController.getSystemAnalytics);
router.get('/dashboard', verifyToken, SuperAdminDashboardController.getDashboardMetrics);

module.exports = router;

