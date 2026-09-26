const express = require('express');
const router = express.Router();
const PreStartChecklistController = require('../controllers/PreStartChecklistController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(PreStartChecklistController.getAll)
  .post(PreStartChecklistController.create);

router.route('/:id')
  .get(PreStartChecklistController.getById)
  .put(PreStartChecklistController.update)
  .delete(PreStartChecklistController.delete);

module.exports = router;
