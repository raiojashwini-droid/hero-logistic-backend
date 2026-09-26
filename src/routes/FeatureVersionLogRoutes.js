const express = require('express');
const router = express.Router();
const FeatureVersionLogController = require('../controllers/FeatureVersionLogController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(FeatureVersionLogController.getAll)
  .post(FeatureVersionLogController.create);

router.route('/:id')
  .get(FeatureVersionLogController.getById)
  .put(FeatureVersionLogController.update)
  .delete(FeatureVersionLogController.delete);

module.exports = router;
