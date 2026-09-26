const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/DocumentController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(DocumentController.getAll)
  .post(DocumentController.create);

router.route('/:id')
  .get(DocumentController.getById)
  .put(DocumentController.update)
  .delete(DocumentController.delete);

module.exports = router;
