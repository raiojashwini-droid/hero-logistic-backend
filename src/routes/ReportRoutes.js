const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ReportController.getAll)
  .post(ReportController.create);

router.route('/:id')
  .get(ReportController.getById)
  .put(ReportController.update)
  .delete(ReportController.delete);

module.exports = router;
