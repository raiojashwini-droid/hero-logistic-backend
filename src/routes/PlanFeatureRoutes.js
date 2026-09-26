const express = require('express');
const router = express.Router();
const PlanFeatureController = require('../controllers/PlanFeatureController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(PlanFeatureController.getAll)
  .post(PlanFeatureController.create);

router.route('/:id')
  .get(PlanFeatureController.getById)
  .put(PlanFeatureController.update)
  .delete(PlanFeatureController.delete);

module.exports = router;
