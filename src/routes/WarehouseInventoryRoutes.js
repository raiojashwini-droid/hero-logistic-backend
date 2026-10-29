const express = require('express');
const router = express.Router({ mergeParams: true });
const WarehouseInventoryController = require('../controllers/WarehouseInventoryController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

// Base endpoints (both with and without trailing slash)
router.get('/', WarehouseInventoryController.getInventory);
router.get('', WarehouseInventoryController.getInventory);

router.post('/', WarehouseInventoryController.createInventoryItem);
router.post('', WarehouseInventoryController.createInventoryItem);

// Available stock for load creation
router.get('/available', WarehouseInventoryController.getAvailableStock);

// Warehouses list (both plural & singular alias)
router.get('/warehouses', WarehouseInventoryController.getWarehouses);
router.get('/warehouse', WarehouseInventoryController.getWarehouses);

// Single item operations
router.put('/:id', WarehouseInventoryController.updateInventoryItem);
router.delete('/:id', WarehouseInventoryController.deleteInventoryItem);

module.exports = router;
