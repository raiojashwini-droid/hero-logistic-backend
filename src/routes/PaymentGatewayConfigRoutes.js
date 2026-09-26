const express = require('express');
const router = express.Router();
const PaymentGatewayConfigController = require('../controllers/PaymentGatewayConfigController');

router.get('/', PaymentGatewayConfigController.getConfig);
router.post('/', PaymentGatewayConfigController.updateConfig);

module.exports = router;
