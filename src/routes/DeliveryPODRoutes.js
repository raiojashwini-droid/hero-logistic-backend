const express = require('express');
const router = express.Router();
const DeliveryPODController = require('../controllers/DeliveryPODController');
const auth = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(auth.verifyToken, resolveTenant);

router.route('/')
  .get(DeliveryPODController.getAll)
  .post(DeliveryPODController.create);

router.route('/:id')
  .get(DeliveryPODController.getById)
  .put(DeliveryPODController.update)
  .delete(DeliveryPODController.delete);

module.exports = router;
