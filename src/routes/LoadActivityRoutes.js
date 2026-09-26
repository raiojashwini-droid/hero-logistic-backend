const express = require('express');
const router = express.Router();
const LoadActivityController = require('../controllers/LoadActivityController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(LoadActivityController.getAll)
  .post(LoadActivityController.create);

router.route('/:id')
  .get(LoadActivityController.getById)
  .put(LoadActivityController.update)
  .delete(LoadActivityController.delete);

module.exports = router;
