const express = require('express');
const router = express.Router();
const ModuleUsageLogController = require('../controllers/ModuleUsageLogController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.post('/ping', ModuleUsageLogController.ping);

router.route('/')
  .get(ModuleUsageLogController.getAll)
  .post(ModuleUsageLogController.create);

router.route('/:id')
  .get(ModuleUsageLogController.getById)
  .put(ModuleUsageLogController.update)
  .delete(ModuleUsageLogController.delete);

module.exports = router;
