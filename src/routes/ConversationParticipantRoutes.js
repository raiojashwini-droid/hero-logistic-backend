const express = require('express');
const router = express.Router();
const ConversationParticipantController = require('../controllers/ConversationParticipantController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(ConversationParticipantController.getAll)
  .post(ConversationParticipantController.create);

router.route('/:id')
  .get(ConversationParticipantController.getById)
  .put(ConversationParticipantController.update)
  .delete(ConversationParticipantController.delete);

module.exports = router;
