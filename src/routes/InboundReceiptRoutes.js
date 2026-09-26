const express = require('express');
const router = express.Router();
const InboundReceiptController = require('../controllers/InboundReceiptController');
const auth = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(auth.verifyToken, resolveTenant);

router.route('/')
  .get(InboundReceiptController.getAll)
  .post(InboundReceiptController.create);

router.route('/:id')
  .get(InboundReceiptController.getById)
  .put(InboundReceiptController.update)
  .delete(InboundReceiptController.delete);

module.exports = router;
