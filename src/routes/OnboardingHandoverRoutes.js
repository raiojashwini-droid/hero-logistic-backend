const express = require('express');
const router = express.Router();
const controller = require('../controllers/OnboardingHandoverController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.post('/:id/provision', controller.submitToProvisioning);

module.exports = router;
