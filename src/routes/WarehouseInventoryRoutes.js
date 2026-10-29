const express = require('express');
const router = express.Router();
const WarehouseInventoryController = require('../controllers/WarehouseInventoryController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);
router.get('/', WarehouseInventoryController.getInventory);
router.get('/available', WarehouseInventoryController.getAvailableStock);
router.get('/warehouses', WarehouseInventoryController.getWarehouses);
router.post('/', WarehouseInventoryController.createInventoryItem);
router.put('/:id', WarehouseInventoryController.updateInventoryItem);
router.delete('/:id', WarehouseInventoryController.deleteInventoryItem);

module.exports = router;
