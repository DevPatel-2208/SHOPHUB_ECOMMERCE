import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
  getUserActivities,
  getUserSecurityLogs,
  getLoginHistory,
  getUserSessions,
  terminateSession,
  getUserDashboard,
  getUsers,
  updateUserStatus,
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Protected user routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/upload-avatar', protect, uploadSingle, uploadAvatar);
router.delete('/avatar', protect, removeAvatar);

// Dashboard & activity routes
router.get('/dashboard', protect, getUserDashboard);
router.get('/activities', protect, getUserActivities);
router.get('/security-logs', protect, getUserSecurityLogs);
router.get('/login-history', protect, getLoginHistory);
router.get('/sessions', protect, getUserSessions);
router.delete('/sessions/:sessionId', protect, terminateSession);

// Admin routes
router.get('/', protect, adminOnly, getUsers);
router.patch('/:id/status', protect, adminOnly, updateUserStatus);

export default router;
