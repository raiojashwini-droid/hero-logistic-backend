const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

router.route('/')
  .get(UserController.getAll)
  .post(UserController.create);

router.route('/:id')
  .get(UserController.getById)
  .put(UserController.update)
  .delete(UserController.delete);

module.exports = router;
