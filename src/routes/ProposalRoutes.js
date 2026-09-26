const express = require('express');
const router = express.Router();
const ProposalController = require('../controllers/ProposalController');
const { verifyToken, requireSalesAccess } = require('../middlewares/auth');

router.use(verifyToken);
router.use(requireSalesAccess);

router.route('/')
  .get(ProposalController.getAll)
  .post(ProposalController.create);

router.route('/:id/provision')
  .post(ProposalController.provision);

router.route('/:id')
  .get(ProposalController.getById)
  .put(ProposalController.update)
  .delete(ProposalController.delete);

module.exports = router;
