const express = require('express');
const router = express.Router();
const EquipmentSwapController = require('../controllers/EquipmentSwapController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(EquipmentSwapController.getAll)
  .post(EquipmentSwapController.create);

router.route('/:id')
  .get(EquipmentSwapController.getById)
  .put(EquipmentSwapController.update)
  .delete(EquipmentSwapController.delete);

module.exports = router;
