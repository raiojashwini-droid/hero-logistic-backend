const express = require('express');
const router = express.Router();
const LoadItemController = require('../controllers/LoadItemController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(LoadItemController.getAll)
  .post(LoadItemController.create);

router.route('/:id')
  .get(LoadItemController.getById)
  .put(LoadItemController.update)
  .delete(LoadItemController.delete);

module.exports = router;
