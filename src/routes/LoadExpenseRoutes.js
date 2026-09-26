const express = require('express');
const router = express.Router();
const LoadExpenseController = require('../controllers/LoadExpenseController');
const auth = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(auth.verifyToken, resolveTenant);

router.route('/')
  .get(LoadExpenseController.getAll)
  .post(LoadExpenseController.create);

router.route('/:id')
  .get(LoadExpenseController.getById)
  .put(LoadExpenseController.update)
  .delete(LoadExpenseController.delete);

module.exports = router;
