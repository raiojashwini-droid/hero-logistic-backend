const express = require('express');
const router = express.Router();
const LoadController = require('../controllers/LoadController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');
const { requireIdempotency } = require('../middlewares/idempotency');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(LoadController.getAll)
  .post(LoadController.create);

router.get('/planning-board', LoadController.getPlanningBoard);
router.get('/active', LoadController.getActiveLoads);

router.route('/:id')
  .get(LoadController.getById)
  .put(LoadController.update)
  .delete(LoadController.delete);

// Custom routes
router.post('/:id/activate', requireIdempotency, LoadController.activate);
router.post('/:id/assignments', LoadController.assign);
router.post('/:id/status-transitions', LoadController.updateStatus);

module.exports = router;
