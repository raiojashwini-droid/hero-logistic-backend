const express = require('express');
const router = express.Router();
const CompanyAdminDashboardController = require('../controllers/CompanyAdminDashboardController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.get('/metrics', verifyToken, resolveTenant, CompanyAdminDashboardController.getDashboardMetrics);
router.get('/dashboard', verifyToken, resolveTenant, CompanyAdminDashboardController.getDashboardMetrics);
router.get('/', verifyToken, resolveTenant, CompanyAdminDashboardController.getDashboardMetrics);

module.exports = router;
