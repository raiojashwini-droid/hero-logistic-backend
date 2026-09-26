const express = require('express');
const router = express.Router();
const CompanyFeatureOverrideController = require('../controllers/CompanyFeatureOverrideController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(CompanyFeatureOverrideController.getAll)
  .post(CompanyFeatureOverrideController.create);

router.route('/:id')
  .get(CompanyFeatureOverrideController.getById)
  .put(CompanyFeatureOverrideController.update)
  .delete(CompanyFeatureOverrideController.delete);

module.exports = router;
