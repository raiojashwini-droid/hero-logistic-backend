const express = require('express');
const router = express.Router();
const AssetTransferController = require('../controllers/AssetTransferController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(AssetTransferController.getAll)
  .post(AssetTransferController.create);

router.route('/:id')
  .get(AssetTransferController.getById)
  .put(AssetTransferController.update)
  .delete(AssetTransferController.delete);

module.exports = router;
