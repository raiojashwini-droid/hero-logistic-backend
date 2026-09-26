const express = require('express');
const router = express.Router();
const PayPeriodController = require('../controllers/PayPeriodController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(PayPeriodController.getAll)
  .post(PayPeriodController.create);

router.route('/:id')
  .get(PayPeriodController.getById)
  .put(PayPeriodController.update)
  .delete(PayPeriodController.delete);

module.exports = router;
