const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  changePassword,
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');

router.post('/register', optionalAuth, registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
