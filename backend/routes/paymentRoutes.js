import express from 'express';
import { createPayment, verifyPayment, paymentWebhook, paymentCallback } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/create', protect, paymentLimiter, createPayment);
router.post('/verify', protect, verifyPayment);
// Raw body capture handled at app level in server.js (conditional middleware
// before express.json()) — DO NOT add express.raw() here, it would re-read
// an already-consumed stream
router.post('/webhook', paymentWebhook);
router.get('/callback', paymentCallback);

export default router;
