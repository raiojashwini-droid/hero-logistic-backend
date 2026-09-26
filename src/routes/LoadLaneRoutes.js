const express = require('express');
const router = express.Router();
const LoadLaneController = require('../controllers/LoadLaneController');
const auth = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(auth.verifyToken, resolveTenant);

router.route('/')
  .get(LoadLaneController.getAll)
  .post(LoadLaneController.create);

router.route('/:id')
  .get(LoadLaneController.getById)
  .put(LoadLaneController.update)
  .delete(LoadLaneController.delete);

module.exports = router;
