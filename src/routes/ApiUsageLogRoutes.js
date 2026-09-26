const express = require('express');
const router = express.Router();
const ApiUsageLogController = require('../controllers/ApiUsageLogController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ApiUsageLogController.getAll)
  .post(ApiUsageLogController.create);

router.route('/:id')
  .get(ApiUsageLogController.getById)
  .put(ApiUsageLogController.update)
  .delete(ApiUsageLogController.delete);

module.exports = router;
