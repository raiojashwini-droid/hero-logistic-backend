const express = require('express');
const router = express.Router();
const NetworkedPrinterController = require('../controllers/NetworkedPrinterController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(NetworkedPrinterController.getAll)
  .post(NetworkedPrinterController.create);

router.route('/:id')
  .get(NetworkedPrinterController.getById)
  .put(NetworkedPrinterController.update)
  .delete(NetworkedPrinterController.delete);

module.exports = router;
