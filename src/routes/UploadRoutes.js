const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/UploadController');
const { verifyToken } = require('../middlewares/auth');

router.post('/', verifyToken, UploadController.uploadBase64Image);

module.exports = router;
