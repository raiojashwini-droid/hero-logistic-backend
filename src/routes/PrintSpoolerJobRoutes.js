const express = require('express');
const router = express.Router();
const PrintSpoolerJobController = require('../controllers/PrintSpoolerJobController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(PrintSpoolerJobController.getAll)
  .post(PrintSpoolerJobController.create);

router.route('/:id')
  .get(PrintSpoolerJobController.getById)
  .put(PrintSpoolerJobController.update)
  .delete(PrintSpoolerJobController.delete);

module.exports = router;
