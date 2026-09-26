const express = require('express');
const router = express.Router();
const TenantSubscriptionController = require('../controllers/TenantSubscriptionController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(TenantSubscriptionController.getAll)
  .post(TenantSubscriptionController.create);

router.route('/:id')
  .get(TenantSubscriptionController.getById)
  .put(TenantSubscriptionController.update)
  .delete(TenantSubscriptionController.delete);

module.exports = router;
