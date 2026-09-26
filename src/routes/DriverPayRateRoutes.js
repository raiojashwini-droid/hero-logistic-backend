const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/DriverPayRateController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.post('/bulk', ctrl.bulkUpsert);

router.route('/')
  .get(ctrl.getAll)
  .post(ctrl.create);

router.route('/:id')
  .get(ctrl.getById)
  .put(ctrl.update)
  .delete(ctrl.delete);

module.exports = router;
