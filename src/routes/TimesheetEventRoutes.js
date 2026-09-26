const express = require('express');
const router = express.Router();
const TimesheetEventController = require('../controllers/TimesheetEventController');
const auth = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(auth.verifyToken, resolveTenant);

router.route('/')
  .get(TimesheetEventController.getAll)
  .post(TimesheetEventController.create);

router.route('/:id')
  .get(TimesheetEventController.getById)
  .put(TimesheetEventController.update)
  .delete(TimesheetEventController.delete);

module.exports = router;
