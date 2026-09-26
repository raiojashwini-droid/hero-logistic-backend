const express = require('express');
const router = express.Router();
const BillingRecordController = require('../controllers/BillingRecordController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(BillingRecordController.getAll)
  .post(BillingRecordController.create);

router.route('/:id')
  .get(BillingRecordController.getById)
  .put(BillingRecordController.update)
  .delete(BillingRecordController.delete);

module.exports = router;
