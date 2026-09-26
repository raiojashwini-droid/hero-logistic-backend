const express = require('express');
const router = express.Router();
const FollowUpTaskController = require('../controllers/FollowUpTaskController');
const { verifyToken, requireSalesAccess } = require('../middlewares/auth');

router.use(verifyToken);
router.use(requireSalesAccess);

router.route('/')
  .get(FollowUpTaskController.getAll)
  .post(FollowUpTaskController.create);

router.route('/:id')
  .get(FollowUpTaskController.getById)
  .put(FollowUpTaskController.update)
  .delete(FollowUpTaskController.delete);

module.exports = router;
