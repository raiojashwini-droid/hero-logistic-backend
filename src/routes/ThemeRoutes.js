const express = require('express');
const router = express.Router();
const ThemeController = require('../controllers/ThemeController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ThemeController.getAll)
  .post(ThemeController.create);

router.route('/:id')
  .get(ThemeController.getById)
  .put(ThemeController.update)
  .delete(ThemeController.delete);

module.exports = router;
