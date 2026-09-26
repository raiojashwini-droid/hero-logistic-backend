const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/DriverController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(DriverController.getAll)
  .post(DriverController.create);

router.route('/:id')
  .get(DriverController.getById)
  .put(DriverController.update)
  .delete(DriverController.delete);

module.exports = router;
