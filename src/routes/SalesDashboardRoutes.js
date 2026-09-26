const express = require('express');
const router = express.Router();
const SalesDashboardController = require('../controllers/SalesDashboardController');
const { verifyToken, requireSalesAccess } = require('../middlewares/auth');

router.use(verifyToken);
router.use(requireSalesAccess);

router.get('/summary', SalesDashboardController.getSummary);

module.exports = router;
