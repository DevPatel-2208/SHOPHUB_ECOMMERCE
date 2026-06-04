import express from 'express';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from '../controllers/couponController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validator.js';

const router = express.Router();

router.get('/admin', protect, adminOnly, getCoupons);
router.post('/', protect, adminOnly, validate(schemas.coupon), createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);
router.post('/validate', validateCoupon);

export default router;
