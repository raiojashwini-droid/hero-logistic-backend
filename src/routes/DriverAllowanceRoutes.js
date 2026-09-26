const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/DriverAllowanceController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(ctrl.getAll)
  .post(ctrl.create);

router.route('/:id')
  .get(ctrl.getById)
  .put(ctrl.update)
  .delete(ctrl.delete);

module.exports = router;
