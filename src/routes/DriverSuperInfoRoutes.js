const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/DriverSuperInfoController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

router.get('/:driverId', ctrl.getByDriverId);
router.post('/', ctrl.upsert);

module.exports = router;
