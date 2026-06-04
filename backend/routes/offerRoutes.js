import express from 'express';
import { getActiveOffers } from '../controllers/homeController.js';

const router = express.Router();

// @desc    Get active offers (public)
// @route   GET /api/offers/active
router.get('/active', getActiveOffers);

export default router;