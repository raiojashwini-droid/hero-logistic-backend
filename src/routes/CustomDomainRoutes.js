const express = require('express');
const router = express.Router();
const CustomDomainController = require('../controllers/CustomDomainController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(CustomDomainController.getAll)
  .post(CustomDomainController.create);

router.route('/:id')
  .get(CustomDomainController.getById)
  .put(CustomDomainController.update)
  .delete(CustomDomainController.delete);

module.exports = router;
