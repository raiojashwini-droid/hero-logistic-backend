const express = require('express');
const router = express.Router();
const NotificationTemplateController = require('../controllers/NotificationTemplateController');

router.get('/', NotificationTemplateController.getAll);
router.post('/', NotificationTemplateController.create);
router.delete('/:id', NotificationTemplateController.delete);

module.exports = router;
