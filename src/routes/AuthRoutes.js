const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { verifyToken } = require('../middlewares/auth');

router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/me', verifyToken, AuthController.me);
router.post('/impersonate', verifyToken, AuthController.impersonate);
router.post('/impersonate/exit', verifyToken, AuthController.exitImpersonate);

module.exports = router;
