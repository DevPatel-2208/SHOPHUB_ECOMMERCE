import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';

const NotificationBell = () => {
  const {
    unreadCount,
    soundEnabled,
    vibrationEnabled,
    vibrationSupported,
    isMobile,
    toggleSound,
    toggleVibration,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1200);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showVibrationToggle = vibrationSupported;

  const vibrationTitle = !vibrationSupported
    ? 'Vibration not supported on this device'
    : !isMobile
      ? 'Vibration available on mobile devices (desktop detected)'
      : vibrationEnabled
        ? 'Disable vibration'
        : 'Enable vibration';

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        {showVibrationToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleVibration(); }}
            className={`p-2 rounded-xl transition-colors ${
              vibrationEnabled
                ? 'text-primary hover:bg-primary/10'
                : 'text-gray-400 dark:text-gray-500 hover:bg-light-hover dark:hover:bg-dark-hover'
            } ${!isMobile ? 'opacity-70' : ''}`}
            title={vibrationTitle}
          >
            <motion.div
              animate={vibrationEnabled && isMobile ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Smartphone className="w-4 h-4" />
            </motion.div>
          </button>
        )}

        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl transition-colors ${
            soundEnabled
              ? 'text-primary hover:bg-primary/10'
              : 'text-gray-400 dark:text-gray-500 hover:bg-light-hover dark:hover:bg-dark-hover'
          }`}
          title={soundEnabled ? 'Mute notifications' : 'Enable notification sound'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl hover:bg-light-hover dark:hover:bg-dark-hover text-gray-600 dark:text-gray-300 transition-colors"
          title="Notifications"
        >
          <motion.div
            animate={isAnimating ? {
              rotate: [0, -18, 18, -15, 15, -10, 10, -5, 5, 0],
              scale: [1, 1.3, 1.25, 1.15, 1.1, 1.05, 1.05, 1],
            } : {}}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold px-1 shadow-lg shadow-danger/30"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>

          {unreadCount > 0 && (
            <motion.span
              className="absolute inset-0 rounded-xl border-2 border-danger/30"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
