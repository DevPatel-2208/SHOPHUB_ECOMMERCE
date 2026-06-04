import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, CreditCard, XCircle, Package, AlertTriangle,
  RefreshCw, CheckCheck, Trash2, ExternalLink, Clock, Bell,
  Volume2, VolumeX, Smartphone,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { isVibrationSupported } from '../../utils/notificationVibration.js';

const typeConfig = {
  new_order: { icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  payment_success: { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  order_cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  low_stock: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  refund: { icon: RefreshCw, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  new_customer: { icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  system: { icon: Package, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffMs = now - notifDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return notifDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    soundEnabled,
    toggleSound,
    vibrationEnabled,
    toggleVibration,
  } = useNotifications();
  const [clearing, setClearing] = useState(false);

  const recentNotifications = notifications.slice(0, 10);

  const handleClearAll = async () => {
    setClearing(true);
    await clearAll();
    setClearing(false);
  };

  const vibrationSupported = isVibrationSupported();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute right-0 top-full mt-2 w-[400px] max-w-[calc(100vw-1rem)] sm:w-[440px] origin-top-right"
    >
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">Notifications</h3>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  soundEnabled
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              {vibrationSupported && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVibration(); }}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    vibrationEnabled
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title={vibrationEnabled ? 'Disable vibration' : 'Enable vibration'}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'No unread notifications'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className={`flex items-center justify-between px-5 py-2 border-b border-light-border dark:border-dark-border ${
          soundEnabled && (vibrationEnabled || !vibrationSupported)
            ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
            : 'bg-amber-50/50 dark:bg-amber-900/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {soundEnabled ? (
                <Volume2 className="w-3 h-3 text-emerald-500" />
              ) : (
                <VolumeX className="w-3 h-3 text-amber-500" />
              )}
              <span className={`text-[11px] font-medium ${
                soundEnabled
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                Sound {soundEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            {vibrationSupported && (
              <div className="flex items-center gap-1.5">
                <Smartphone className={`w-3 h-3 ${
                  vibrationEnabled ? 'text-emerald-500' : 'text-amber-500'
                }`} />
                <span className={`text-[11px] font-medium ${
                  vibrationEnabled
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  Vibration {vibrationEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleSound(); }}
              className={`text-[11px] font-medium transition-colors ${
                soundEnabled
                  ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  : 'text-primary hover:text-primary-dark'
              }`}
            >
              {soundEnabled ? 'Mute' : 'Enable Sound'}
            </button>
            {vibrationSupported && (
              <>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVibration(); }}
                  className={`text-[11px] font-medium transition-colors ${
                    vibrationEnabled
                      ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      : 'text-primary hover:text-primary-dark'
                  }`}
                >
                  {vibrationEnabled ? 'Disable Vibration' : 'Enable Vibration'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading notifications...</span>
              </div>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">No notifications yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center max-w-[240px]">
                When new orders arrive or other events occur, they'll appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-light-border dark:divide-dark-border">
              {recentNotifications.map((notification, index) => {
                const config = typeConfig[notification.type] || typeConfig.system;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`relative group transition-colors ${
                      !notification.isRead
                        ? 'bg-primary/5 dark:bg-primary/5 hover:bg-primary/10 dark:hover:bg-primary/10'
                        : 'hover:bg-light-hover dark:hover:bg-dark-hover'
                    }`}
                  >
                    <Link
                      to={notification.link || '#'}
                      onClick={() => {
                        if (!notification.isRead) markAsRead(notification._id);
                        onClose();
                      }}
                      className="flex items-start gap-3 px-5 py-4"
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white leading-tight`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.amount && (
                          <p className="text-xs font-semibold text-secondary mt-1">
                            ₹{notification.amount.toLocaleString('en-IN')}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {notification.customerName && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                                {notification.customerName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 hover:text-primary transition-colors"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                            if (notification.link) navigate(notification.link);
                          }}
                          className="p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="View details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-light-border dark:border-dark-border bg-gray-50/50 dark:bg-dark/50">
          <Link
            to="/notifications"
            onClick={onClose}
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            View all notifications
          </Link>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-danger transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              {clearing ? 'Clearing...' : 'Clear all'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationDropdown;
