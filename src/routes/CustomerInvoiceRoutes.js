const express = require('express');
const router = express.Router();
const CustomerInvoiceController = require('../controllers/CustomerInvoiceController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant, resolveCompanyId } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.post('/auto-generate/:loadId', async (req, res, next) => {
  try {
    const { loadId } = req.params;
    const { customAmount } = req.body || {};
    const companyId = resolveCompanyId(req);
    const { autoGenerateLoadInvoice } = require('../controllers/CompanyAdminPortalController');
    const result = await autoGenerateLoadInvoice(loadId, companyId, customAmount);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.route('/')
  .get(CustomerInvoiceController.getAll)
  .post(CustomerInvoiceController.create);

router.route('/:id')
  .get(CustomerInvoiceController.getById)
  .put(CustomerInvoiceController.update)
  .delete(CustomerInvoiceController.delete);

module.exports = router;
