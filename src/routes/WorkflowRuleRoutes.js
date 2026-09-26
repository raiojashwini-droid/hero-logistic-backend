const express = require('express');
const router = express.Router();
const WorkflowRuleController = require('../controllers/WorkflowRuleController');

router.route('/')
  .get(WorkflowRuleController.getAll)
  .post(WorkflowRuleController.create);

router.route('/:id')
  .get(WorkflowRuleController.getById)
  .put(WorkflowRuleController.update)
  .delete(WorkflowRuleController.delete);

module.exports = router;
