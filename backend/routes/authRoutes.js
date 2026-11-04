import express from 'express';
import passport from 'passport';
import {
  register, login, verifyOTP, resendOTP,
  forgotPassword, resetPassword, getMe, logout, googleCallback, refreshToken
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/verify-otp', authLimiter, validate(schemas.otpVerify), verifyOTP);
router.post('/resend-otp', authLimiter, validate(schemas.resendOtp), resendOTP);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), forgotPassword);
router.put('/reset-password/:token', authLimiter, validate(schemas.resetPassword), resetPassword);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.post('/logout', logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

export default router;
