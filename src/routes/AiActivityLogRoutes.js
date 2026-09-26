const express = require('express');
const router = express.Router();
const AiActivityLogController = require('../controllers/AiActivityLogController');
const auth = require('../middlewares/auth');

// Default open for testing, uncomment auth to protect routes
router.use(auth.verifyToken);

router.route('/')
  .get(AiActivityLogController.getAll)
  .post(AiActivityLogController.create);

router.route('/:id')
  .get(AiActivityLogController.getById)
  .put(AiActivityLogController.update)
  .delete(AiActivityLogController.delete);

module.exports = router;
