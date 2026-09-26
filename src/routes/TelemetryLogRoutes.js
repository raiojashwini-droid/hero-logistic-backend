const express = require('express');
const router = express.Router();
const TelemetryLogController = require('../controllers/TelemetryLogController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(TelemetryLogController.getAll)
  .post(TelemetryLogController.create);

router.route('/:id')
  .get(TelemetryLogController.getById)
  .put(TelemetryLogController.update)
  .delete(TelemetryLogController.delete);

module.exports = router;
