// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, forgotPassword, resetPassword, getMe, refreshToken, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.post('/refresh-token', refreshToken);
router.put('/update-password', protect, updatePassword);

module.exports = router;
