const express = require('express');
const router = express.Router();
const FeatureController = require('../controllers/FeatureController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(FeatureController.getAll)
  .post(FeatureController.create);

router.route('/:id')
  .get(FeatureController.getById)
  .put(FeatureController.update)
  .delete(FeatureController.delete);

module.exports = router;
