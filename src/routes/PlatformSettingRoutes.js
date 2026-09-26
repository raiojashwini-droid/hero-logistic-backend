const express = require('express');
const router = express.Router();
const PlatformSettingController = require('../controllers/PlatformSettingController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', PlatformSettingController.getPlatformSettings);
router.put('/', PlatformSettingController.updatePlatformSettings);

module.exports = router;
