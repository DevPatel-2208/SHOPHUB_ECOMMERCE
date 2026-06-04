import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Bell, Smartphone, Zap } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';

const NotificationToast = () => {
  const { latestNotification, markAsRead, vibrationEnabled, soundEnabled, isMobile, vibrationSupported } = useNotifications();
  const [currentNotif, setCurrentNotif] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);
  const keyRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (latestNotification) {
      keyRef.current += 1;
      setCurrentNotif(latestNotification);
      setIsVisible(true);
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setCurrentNotif(null);
      }, 9000);
    } else {
      setIsVisible(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [latestNotification]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getNotificationIcon = () => {
    if (!currentNotif) return ShoppingBag;
    switch (currentNotif.type) {
      case 'payment_success':
      case 'payment':
        return Smartphone;
      case 'urgent_alert':
      case 'order_cancelled':
        return Bell;
      default:
        return ShoppingBag;
    }
  };

  const NotificationIcon = currentNotif ? getNotificationIcon() : ShoppingBag;

  return (
    <AnimatePresence mode="wait">
      {isVisible && currentNotif && (
        <motion.div
          key={`toast-${keyRef.current}`}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-[380px] w-full"
        >
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 9, ease: 'linear' }}
              className="h-1 bg-gradient-to-r from-primary to-secondary"
            />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <motion.div
                    animate={{
                      rotate: [0, -12, 12, -10, 10, -5, 5, 0],
                      scale: [1, 1.15, 1.1, 1.05, 1],
                    }}
                    transition={{ duration: 0.7, delay: 0.15, ease: 'easeInOut' }}
                  >
                    <NotificationIcon className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {currentNotif.title || 'New Order Received'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {currentNotif.message}
                      </p>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="shrink-0 p-1 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {currentNotif.amount && (
                      <span className="text-sm font-bold text-secondary">
                        {formatAmount(currentNotif.amount)}
                      </span>
                    )}
                    {currentNotif.customerName && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentNotif.customerName}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto">
                      {formatTimeAgo(currentNotif.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {soundEnabled && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Sound
                      </span>
                    )}
                    {vibrationEnabled && isMobile && vibrationSupported && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        <Zap className="w-2.5 h-2.5" />
                        Vibrating
                      </span>
                    )}
                    {vibrationSupported && !isMobile && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        <Smartphone className="w-2.5 h-2.5" />
                        Desktop
                      </span>
                    )}
                    {!vibrationEnabled && isMobile && vibrationSupported && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <Smartphone className="w-2.5 h-2.5" />
                        Vibration Off
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {currentNotif.link && (
                      <Link
                        to={currentNotif.link}
                        onClick={() => {
                          if (currentNotif._id && !currentNotif._id.startsWith('new_order_') &&
                              !currentNotif._id.startsWith('urgent_') &&
                              !currentNotif._id.startsWith('payment_')) {
                            markAsRead(currentNotif._id);
                          }
                          handleDismiss();
                        }}
                        className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                      >
                        View Details →
                      </Link>
                    )}
                    {currentNotif._id && !currentNotif._id.startsWith('new_order_') &&
                     !currentNotif._id.startsWith('urgent_') &&
                     !currentNotif._id.startsWith('payment_') && (
                      <button
                        onClick={() => markAsRead(currentNotif._id)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;
