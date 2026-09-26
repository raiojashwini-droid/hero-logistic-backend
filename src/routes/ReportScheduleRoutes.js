const express = require('express');
const router = express.Router();
const ReportScheduleController = require('../controllers/ReportScheduleController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ReportScheduleController.getAll)
  .post(ReportScheduleController.create);

router.route('/:id')
  .get(ReportScheduleController.getById)
  .put(ReportScheduleController.update)
  .delete(ReportScheduleController.delete);

module.exports = router;
