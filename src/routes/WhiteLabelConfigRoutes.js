const express = require('express');
const router = express.Router();
const WhiteLabelConfigController = require('../controllers/WhiteLabelConfigController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(WhiteLabelConfigController.getAll)
  .post(WhiteLabelConfigController.create);

router.route('/:id')
  .get(WhiteLabelConfigController.getById)
  .put(WhiteLabelConfigController.update)
  .delete(WhiteLabelConfigController.delete);

module.exports = router;
