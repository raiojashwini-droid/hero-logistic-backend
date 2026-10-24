const express = require('express');
const router = express.Router();
const CustomRoleController = require('../controllers/CustomRoleController');
const auth = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(auth.verifyToken, resolveTenant);

router.route('/')
  .get(CustomRoleController.getAll)
  .post(CustomRoleController.create);

router.route('/:id')
  .get(CustomRoleController.getById)
  .put(CustomRoleController.update)
  .delete(CustomRoleController.delete);

module.exports = router;
