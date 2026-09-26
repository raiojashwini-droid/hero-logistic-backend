const express = require('express');
const router = express.Router();
const AssetMaintenanceController = require('../controllers/AssetMaintenanceController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(AssetMaintenanceController.getAll)
  .post(AssetMaintenanceController.create);

router.route('/:id')
  .get(AssetMaintenanceController.getById)
  .put(AssetMaintenanceController.update)
  .delete(AssetMaintenanceController.delete);

module.exports = router;
