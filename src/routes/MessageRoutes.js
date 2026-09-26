const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(MessageController.getAll)
  .post(MessageController.create);

router.route('/:id')
  .get(MessageController.getById)
  .put(MessageController.update)
  .delete(MessageController.delete);

module.exports = router;
