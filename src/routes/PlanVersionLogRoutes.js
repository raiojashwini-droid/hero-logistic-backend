const express = require('express');
const router = express.Router();
const PlanVersionLogController = require('../controllers/PlanVersionLogController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(PlanVersionLogController.getAll)
  .post(PlanVersionLogController.create);

router.route('/:id')
  .get(PlanVersionLogController.getById)
  .put(PlanVersionLogController.update)
  .delete(PlanVersionLogController.delete);

module.exports = router;
