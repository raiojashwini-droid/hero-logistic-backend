const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.get('/portal', CustomerController.getPortalData);
router.delete('/all', CustomerController.deleteAll);

router.route('/')
  .get(CustomerController.getAll)
  .post(CustomerController.create);

router.route('/:id')
  .get(CustomerController.getById)
  .put(CustomerController.update)
  .delete(CustomerController.delete);

router.route('/:id/contacts')
  .get(CustomerController.getContacts)
  .post(CustomerController.addContact);

router.route('/:id/rate-cards')
  .get(CustomerController.getRateCards)
  .post(CustomerController.addRateCard);

router.route('/:id/rate-cards/:cardId')
  .put(CustomerController.updateRateCard)
  .delete(CustomerController.deleteRateCard);

router.route('/:id/pricing-profiles')
  .get(CustomerController.getPricingProfiles)
  .post(CustomerController.savePricingProfile);

router.route('/:id/surcharges')
  .get(CustomerController.getSurcharges)
  .post(CustomerController.saveSurcharge)
  .delete(CustomerController.deleteSurcharge);

router.delete('/:id/surcharges/:surchargeId', CustomerController.deleteSurcharge);

router.route('/:id/billing-rules')
  .get(CustomerController.getBillingRules)
  .post(CustomerController.saveBillingRule);

module.exports = router;
