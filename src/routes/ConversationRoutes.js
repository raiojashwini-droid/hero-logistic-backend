const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/ConversationController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.get('/depot', ConversationController.getDepotComms);

router.route('/')
  .get(ConversationController.getAll)
  .post(ConversationController.create);

router.route('/:id')
  .get(ConversationController.getById)
  .put(ConversationController.update)
  .delete(ConversationController.delete);

module.exports = router;
