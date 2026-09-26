const express = require('express');
const router = express.Router();
const SupportTicketController = require('../controllers/SupportTicketController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(SupportTicketController.getAll)
  .post(SupportTicketController.create);

router.post('/:id/replies', SupportTicketController.addReply);

router.route('/:id')
  .get(SupportTicketController.getById)
  .put(SupportTicketController.update)
  .delete(SupportTicketController.delete);

module.exports = router;
