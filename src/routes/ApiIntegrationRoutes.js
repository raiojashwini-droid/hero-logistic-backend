const express = require('express');
const router = express.Router();
const ApiIntegrationController = require('../controllers/ApiIntegrationController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ApiIntegrationController.getAll)
  .post(ApiIntegrationController.create);

router.route('/:id')
  .get(ApiIntegrationController.getById)
  .put(ApiIntegrationController.update)
  .delete(ApiIntegrationController.delete);

module.exports = router;
