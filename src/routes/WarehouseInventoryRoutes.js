const express = require('express');
const router = express.Router();
const WarehouseInventoryController = require('../controllers/WarehouseInventoryController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);
router.get('/', WarehouseInventoryController.getInventory);

module.exports = router;
