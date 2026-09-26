const express = require('express');
const router = express.Router();
const RegionalTerminalController = require('../controllers/RegionalTerminalController');

router.route('/')
  .get(RegionalTerminalController.getAll)
  .post(RegionalTerminalController.create);

router.route('/:id')
  .get(RegionalTerminalController.getById)
  .put(RegionalTerminalController.update)
  .delete(RegionalTerminalController.delete);

module.exports = router;
