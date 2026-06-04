import express from 'express';
import passport from 'passport';
import {
  register, login, verifyOTP, resendOTP,
  forgotPassword, resetPassword, getMe, logout, googleCallback
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/verify-otp', authLimiter, validate(schemas.otpVerify), verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

export default router;
