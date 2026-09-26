const express = require('express');
const router = express.Router();
const StagingAreaController = require('../controllers/StagingAreaController');
const auth = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(auth.verifyToken, resolveTenant);

router.route('/')
  .get(StagingAreaController.getAll)
  .post(StagingAreaController.create);

router.route('/:id')
  .get(StagingAreaController.getById)
  .put(StagingAreaController.update)
  .delete(StagingAreaController.delete);

module.exports = router;
