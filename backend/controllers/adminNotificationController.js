import AdminNotification from '../models/AdminNotification.js';

// Simple in-memory cache for unread count (polled frequently)
let unreadCountCache = { count: 0, timestamp: 0 };
const UNREAD_CACHE_TTL = 15000; // 15 seconds

const clearUnreadCountCache = () => {
  unreadCountCache = { count: 0, timestamp: 0 };
};

// @desc    Get all admin notifications (paginated)
// @route   GET /api/admin/notifications
export const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const query = {};

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const [notifications, total, unreadCount] = await Promise.all([
      AdminNotification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      AdminNotification.countDocuments(query),
      AdminNotification.countDocuments({ isRead: false }),
    ]);

    // Update cache with fresh unread count
    unreadCountCache = { count: unreadCount, timestamp: Date.now() };

    res.json({
      success: true,
      notifications,
      unreadCount,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/admin/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).lean();
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    clearUnreadCountCache();
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/admin/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    await AdminNotification.updateMany({ isRead: false }, { isRead: true });
    clearUnreadCountCache();
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/admin/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await AdminNotification.findByIdAndDelete(req.params.id).lean();
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    clearUnreadCountCache();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/admin/notifications/clear-all
export const clearAllNotifications = async (req, res) => {
  try {
    await AdminNotification.deleteMany({});
    clearUnreadCountCache();
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread notification count (with caching)
// @route   GET /api/admin/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    // Return cached count if still valid
    if (Date.now() - unreadCountCache.timestamp < UNREAD_CACHE_TTL) {
      return res.json({ success: true, count: unreadCountCache.count, cached: true });
    }

    const count = await AdminNotification.countDocuments({ isRead: false });
    unreadCountCache = { count, timestamp: Date.now() };

    res.json({ success: true, count, cached: false });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};