import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  trackOrder,
  downloadInvoice,
  getAllOrders,
  getAdminOrder,
  updateOrderStatus,
  cancelOrder,
  requestReturn
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validator.js';

const router = express.Router();

// User routes
router.post('/', protect, validate(schemas.order), createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.get('/:id/track', protect, trackOrder);
router.get('/:id/invoice', protect, downloadInvoice);
router.post('/:id/cancel', protect, cancelOrder);
router.post('/:id/return', protect, requestReturn);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/admin/:id', protect, adminOnly, getAdminOrder);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
