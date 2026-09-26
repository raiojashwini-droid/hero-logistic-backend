const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/CompanyController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(CompanyController.getAll)
  .post(CompanyController.create);

router.delete('/clean/all-test-data', CompanyController.cleanAllTestCompanies);

router.route('/:id')
  .get(CompanyController.getById)
  .put(CompanyController.update)
  .delete(CompanyController.delete);

module.exports = router;
