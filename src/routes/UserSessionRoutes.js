const express = require('express');
const router = express.Router();
const UserSessionController = require('../controllers/UserSessionController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(UserSessionController.getAll)
  .post(UserSessionController.create);

router.route('/:id')
  .get(UserSessionController.getById)
  .put(UserSessionController.update)
  .delete(UserSessionController.delete);

module.exports = router;
