const express = require('express');
const router = express.Router();
const SubscriptionPlanController = require('../controllers/SubscriptionPlanController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(SubscriptionPlanController.getAll)
  .post(SubscriptionPlanController.create);

router.route('/:id')
  .get(SubscriptionPlanController.getById)
  .put(SubscriptionPlanController.update)
  .delete(SubscriptionPlanController.delete);

module.exports = router;
