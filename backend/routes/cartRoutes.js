import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:itemId', protect, updateCartItem);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/', protect, clearCart);
router.post('/apply-coupon', protect, applyCoupon);
router.delete('/coupon', protect, removeCoupon);

export default router;
