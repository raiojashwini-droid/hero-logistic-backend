const express = require('express');
const router = express.Router();
const SalesActivityController = require('../controllers/SalesActivityController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(SalesActivityController.getAll)
  .post(SalesActivityController.create);

router.route('/:id')
  .get(SalesActivityController.getById)
  .put(SalesActivityController.update)
  .delete(SalesActivityController.delete);

module.exports = router;
