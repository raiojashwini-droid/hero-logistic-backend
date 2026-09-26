const express = require('express');
const router = express.Router();
const AiModelController = require('../controllers/AiModelController');

router.get('/', AiModelController.getAll);
router.post('/', AiModelController.create);
router.delete('/:id', AiModelController.delete);

module.exports = router;
