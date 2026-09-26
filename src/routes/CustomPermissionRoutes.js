const express = require('express');
const router = express.Router();
const CustomPermissionController = require('../controllers/CustomPermissionController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(CustomPermissionController.getAll)
  .post(CustomPermissionController.create);

router.route('/:id')
  .get(CustomPermissionController.getById)
  .put(CustomPermissionController.update)
  .delete(CustomPermissionController.delete);

module.exports = router;
