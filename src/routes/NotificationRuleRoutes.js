const express = require('express');
const router = express.Router();
const NotificationRuleController = require('../controllers/NotificationRuleController');

router.get('/', NotificationRuleController.getAll);
router.post('/', NotificationRuleController.create);
router.delete('/:id', NotificationRuleController.delete);

module.exports = router;
