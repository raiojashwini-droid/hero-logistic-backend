const express = require('express');
const router = express.Router();
const OfflineSyncItemController = require('../controllers/OfflineSyncItemController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(OfflineSyncItemController.getAll)
  .post(OfflineSyncItemController.create);

router.route('/:id')
  .get(OfflineSyncItemController.getById)
  .put(OfflineSyncItemController.update)
  .delete(OfflineSyncItemController.delete);

module.exports = router;
