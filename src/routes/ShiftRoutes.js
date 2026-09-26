const express = require('express');
const router = express.Router();
const ShiftController = require('../controllers/ShiftController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ShiftController.getAll)
  .post(ShiftController.create);

router.route('/:id')
  .get(ShiftController.getById)
  .put(ShiftController.update)
  .delete(ShiftController.delete);

module.exports = router;
