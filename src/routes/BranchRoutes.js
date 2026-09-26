const express = require('express');
const router = express.Router();
const BranchController = require('../controllers/BranchController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.route('/')
  .get(BranchController.getAll)
  .post(BranchController.create);

router.route('/:id')
  .get(BranchController.getById)
  .put(BranchController.update)
  .delete(BranchController.delete);

module.exports = router;
