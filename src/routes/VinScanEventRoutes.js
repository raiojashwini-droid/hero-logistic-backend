const express = require('express');
const router = express.Router();
const VinScanEventController = require('../controllers/VinScanEventController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(VinScanEventController.getAll)
  .post(VinScanEventController.create);

router.route('/:id')
  .get(VinScanEventController.getById)
  .put(VinScanEventController.update)
  .delete(VinScanEventController.delete);

module.exports = router;
