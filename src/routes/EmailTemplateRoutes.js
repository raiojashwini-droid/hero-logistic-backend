const express = require('express');
const router = express.Router();
const EmailTemplateController = require('../controllers/EmailTemplateController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(EmailTemplateController.getAll)
  .post(EmailTemplateController.create);

router.route('/:id')
  .get(EmailTemplateController.getById)
  .put(EmailTemplateController.update)
  .delete(EmailTemplateController.delete);

module.exports = router;
