const express = require('express');
const router = express.Router();
const CustomRoleController = require('../controllers/CustomRoleController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(CustomRoleController.getAll)
  .post(CustomRoleController.create);

router.route('/:id')
  .get(CustomRoleController.getById)
  .put(CustomRoleController.update)
  .delete(CustomRoleController.delete);

module.exports = router;
