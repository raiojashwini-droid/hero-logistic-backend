const express = require('express');
const router = express.Router();
const TransferEventLogController = require('../controllers/TransferEventLogController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(TransferEventLogController.getAll)
  .post(TransferEventLogController.create);

router.route('/:id')
  .get(TransferEventLogController.getById)
  .put(TransferEventLogController.update)
  .delete(TransferEventLogController.delete);

module.exports = router;
