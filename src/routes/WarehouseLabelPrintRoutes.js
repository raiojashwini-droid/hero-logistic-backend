const express = require('express');
const router = express.Router();
const WarehouseLabelPrintController = require('../controllers/WarehouseLabelPrintController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(WarehouseLabelPrintController.getAll)
  .post(WarehouseLabelPrintController.create);

router.route('/:id')
  .get(WarehouseLabelPrintController.getById)
  .put(WarehouseLabelPrintController.update)
  .delete(WarehouseLabelPrintController.delete);

module.exports = router;
