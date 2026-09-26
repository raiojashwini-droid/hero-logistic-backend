const express = require('express');
const router = express.Router();
const PerformanceLogController = require('../controllers/PerformanceLogController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(PerformanceLogController.getAll)
  .post(PerformanceLogController.create);

router.route('/:id')
  .get(PerformanceLogController.getById)
  .put(PerformanceLogController.update)
  .delete(PerformanceLogController.delete);

module.exports = router;
