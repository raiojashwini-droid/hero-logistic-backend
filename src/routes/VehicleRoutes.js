const express = require('express');
const router = express.Router();
const VehicleController = require('../controllers/VehicleController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(VehicleController.getAll)
  .post(VehicleController.create);

router.route('/:id')
  .get(VehicleController.getById)
  .put(VehicleController.update)
  .delete(VehicleController.delete);

module.exports = router;
