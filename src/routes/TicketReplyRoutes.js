const express = require('express');
const router = express.Router();
const TicketReplyController = require('../controllers/TicketReplyController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(TicketReplyController.getAll)
  .post(TicketReplyController.create);

router.route('/:id')
  .get(TicketReplyController.getById)
  .put(TicketReplyController.update)
  .delete(TicketReplyController.delete);

module.exports = router;
