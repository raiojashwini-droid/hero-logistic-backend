const express = require('express');
const router = express.Router();
const CustomerInvoiceController = require('../controllers/CustomerInvoiceController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(CustomerInvoiceController.getAll)
  .post(CustomerInvoiceController.create);

router.route('/:id')
  .get(CustomerInvoiceController.getById)
  .put(CustomerInvoiceController.update)
  .delete(CustomerInvoiceController.delete);

module.exports = router;
