const express = require('express');
const router = express.Router();
const CommunicationTemplateController = require('../controllers/CommunicationTemplateController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(CommunicationTemplateController.getAll)
  .post(CommunicationTemplateController.create);

router.route('/:id')
  .get(CommunicationTemplateController.getById)
  .put(CommunicationTemplateController.update)
  .delete(CommunicationTemplateController.delete);

module.exports = router;
