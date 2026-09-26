const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/WarehouseController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(WarehouseController.getAll)
  .post(WarehouseController.create);

router.route('/:id')
  .get(WarehouseController.getById)
  .put(WarehouseController.update)
  .delete(WarehouseController.delete);

module.exports = router;
