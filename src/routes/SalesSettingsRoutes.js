const express = require('express');
const router = express.Router();
const SalesSettingsController = require('../controllers/SalesSettingsController');
const { authenticateToken } = require('../middlewares/auth');

// Get all sales settings
router.get('/', SalesSettingsController.getSettings);

// Email Templates
router.post('/templates', SalesSettingsController.saveTemplate);
router.put('/templates', SalesSettingsController.saveTemplate);
router.delete('/templates/:name', SalesSettingsController.deleteTemplate);

// Pipeline Stages
router.post('/stages', SalesSettingsController.addStage);
router.delete('/stages/:stage', SalesSettingsController.deleteStage);

// Acquisition Sources
router.post('/sources', SalesSettingsController.addSource);
router.delete('/sources/:source', SalesSettingsController.deleteSource);

module.exports = router;
