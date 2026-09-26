const express = require('express');
const router = express.Router();
const RecipientGroupController = require('../controllers/RecipientGroupController');

router.get('/', RecipientGroupController.getAll);
router.post('/', RecipientGroupController.create);
router.delete('/:id', RecipientGroupController.delete);

module.exports = router;
