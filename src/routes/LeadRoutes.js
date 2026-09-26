const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/LeadController');
const { verifyToken, requireSalesAccess } = require('../middlewares/auth');

router.use(verifyToken);
router.use(requireSalesAccess);

router.get('/pipeline', LeadController.getPipelineBoard);
router.get('/trials', LeadController.getTrialCompanies);
router.get('/handovers', LeadController.getOnboardingHandovers);
router.get('/reports', LeadController.getSalesReports);

router.route('/')
  .get(LeadController.getAll)
  .post(LeadController.create);

router.route('/:id')
  .get(LeadController.getById)
  .put(LeadController.update)
  .delete(LeadController.delete);

router.put('/:id/stage', LeadController.updateStage);
router.put('/:id/assign-rep', LeadController.assignRep);
router.put('/:id/extend-trial', LeadController.extendTrial);
router.post('/:id/convert-to-company', LeadController.convertToCompany);

module.exports = router;
