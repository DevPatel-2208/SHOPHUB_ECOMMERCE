import express from 'express';
import {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
} from '../controllers/adminNotificationController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Stricter rate limit for notification polling endpoints
const isDev = process.env.NODE_ENV === 'development';
const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: isDev ? 120 : 60, // 120 req/min in dev, 60 in prod (polling is ~2 req/min normally)
  message: { success: false, message: 'Too many notification requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All admin notification routes require authentication + admin role
router.use(protect, adminOnly);

// Apply notification limiter to high-frequency endpoints
router.get('/', notificationLimiter, getAdminNotifications);
router.get('/unread-count', notificationLimiter, getUnreadCount);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);
router.delete('/clear-all', clearAllNotifications);
router.delete('/:id', deleteNotification);

export default router;