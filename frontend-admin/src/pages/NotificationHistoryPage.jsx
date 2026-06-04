import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell, ShoppingBag, CreditCard, XCircle, Package, AlertTriangle,
  RefreshCw, ArrowLeft, CheckCheck, Trash2, Clock, Filter, Loader2,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';

const typeConfig = {
  new_order: { icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'New Order' },
  payment_success: { icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Payment' },
  order_cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Cancelled' },
  low_stock: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Low Stock' },
  refund: { icon: RefreshCw, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Refund' },
  new_customer: { icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'New Customer' },
  system: { icon: Package, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'System' },
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffMs = now - notifDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return notifDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NotificationHistoryPage = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchNotifications,
  } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter(n => !n.isRead)
      : notifications.filter(n => n.type === filter);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 dark:text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-ghost btn-sm">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="btn-ghost btn-sm text-danger hover:text-danger">
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All', count: notifications.length },
          { value: 'unread', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
          { value: 'new_order', label: 'New Orders', count: notifications.filter(n => n.type === 'new_order').length },
          { value: 'low_stock', label: 'Low Stock', count: notifications.filter(n => n.type === 'low_stock').length },
          { value: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.value
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-light-hover dark:hover:bg-dark-hover border border-light-border dark:border-dark-border'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.value
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="card p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No notifications found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {filter === 'all'
                ? 'You\'re all caught up! New notifications will appear here when something happens.'
                : 'No notifications match the selected filter. Try a different filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification, index) => {
            const config = typeConfig[notification.type] || typeConfig.system;
            const Icon = config.icon;

            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`card group transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-primary/20 dark:border-primary/30 ring-1 ring-primary/10' : ''
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${config.bg}`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`badge badge-${notification.type === 'new_order' ? 'success' : notification.type === 'order_cancelled' ? 'danger' : notification.type === 'low_stock' ? 'warning' : 'neutral'}`}>
                              {config.label}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <h3 className={`text-base mt-2 ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          {notification.amount && (
                            <p className="text-lg font-bold text-secondary mt-2">
                              ₹{notification.amount.toLocaleString('en-IN')}
                            </p>
                          )}
                          {notification.customerEmail && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {notification.customerEmail}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 hover:text-primary transition-colors"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                          {notification.link && (
                            <Link
                              to={notification.link}
                              className="p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 hover:text-primary transition-colors"
                              title="View details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-danger transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimeAgo(notification.createdAt)}
                        {notification.customerName && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span>{notification.customerName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {filteredNotifications.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationHistoryPage;
