import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import api from '../services/api.js';
import { getSocket, onReconnect } from '../services/adminSocket.js';
import {
  vibrateForNotification,
  isVibrationSupported,
  isMobileDevice,
  unlockVibration,
  isVibrationUnlocked,
} from '../utils/notificationVibration.js';

const NotificationContext = createContext();

let sharedAudioCtx = null;
let audioElementRef = null;

const getAudioContext = () => {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playNotificationSoundFx = () => {
  try {
    if (!audioElementRef) {
      audioElementRef = new Audio('/sounds/notification.mp3');
      audioElementRef.volume = 0.7;
    }
    audioElementRef.currentTime = 0;
    audioElementRef.play().catch(() => {
      try {
        const ctx = getAudioContext();
        const g = ctx.createGain();
        g.connect(ctx.destination);
        g.gain.value = 1.5;

        const now = ctx.currentTime;

        const o1 = ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.value = 880;
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(1.0, now);
        g1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o1.connect(g1);
        g1.connect(g);
        o1.start(now);
        o1.stop(now + 0.5);

        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = 1108.73;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.8, now + 0.3);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
        o2.connect(g2);
        g2.connect(g);
        o2.start(now + 0.3);
        o2.stop(now + 0.9);

        const o3 = ctx.createOscillator();
        o3.type = 'triangle';
        o3.frequency.value = 660;
        const g3 = ctx.createGain();
        g3.gain.setValueAtTime(0.6, now + 0.5);
        g3.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
        o3.connect(g3);
        g3.connect(g);
        o3.start(now + 0.5);
        o3.stop(now + 1.3);

        g.gain.setValueAtTime(1.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      } catch (e) {
        console.warn('[Notification] Sound playback failed:', e);
      }
    });
  } catch (e) {
    console.warn('[Notification] Sound playback failed:', e);
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('admin_notification_sound') !== 'false';
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    const stored = localStorage.getItem('admin_notification_vibration');
    if (stored !== null) return stored === 'true';
    return isVibrationSupported() && isMobileDevice();
  });
  const [vibrationSupported] = useState(() => isVibrationSupported());
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());
  const [latestNotification, setLatestNotification] = useState(null);
  const audioUnlockedRef = useRef(false);
  const lastVibrationTime = useRef(0);
  const mountedRef = useRef(false);
  const knownNotificationIds = useRef(new Set());
  const listenerCleanupRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unlock = () => {
      if (!audioUnlockedRef.current) {
        try {
          const ctx = getAudioContext();
          ctx.resume().then(() => {
            audioUnlockedRef.current = true;
            console.log('[Notification] AudioContext unlocked');
          }).catch(() => {});
        } catch (e) {}
      }
      if (!isVibrationUnlocked()) {
        unlockVibration();
      }
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    playNotificationSoundFx();
  }, [soundEnabled]);

  const triggerVibration = useCallback((notificationType) => {
    if (!vibrationEnabled || !isMobile) return false;
    const now = Date.now();
    if (now - lastVibrationTime.current < 1500) return false;
    lastVibrationTime.current = now;
    return vibrateForNotification(notificationType);
  }, [vibrationEnabled, isMobile]);

  const normalizeLink = (notification) => {
    if (!notification || !notification.link) return notification;
    if (notification.link.startsWith('/orders/')) {
      return { ...notification, link: '/orders' };
    }
    return notification;
  };

  const addNotificationToState = useCallback((notification) => {
    if (!notification) return false;
    const normalized = normalizeLink(notification);
    const id = normalized._id;
    const orderId = normalized.orderId;
    if (id && knownNotificationIds.current.has(id)) return false;
    if (orderId && knownNotificationIds.current.has(orderId)) return false;
    if (id) knownNotificationIds.current.add(id);
    if (orderId) knownNotificationIds.current.add(orderId);
    setNotifications(prev => [normalized, ...prev]);
    setUnreadCount(prev => prev + 1);
    return true;
  }, []);

  const triggerNotificationEffects = useCallback((notification) => {
    playNotificationSound();
    triggerVibration(notification.type || notification.notificationType || 'short');
    setLatestNotification(notification);
    if (notification.title) {
      toast(notification.title, {
        icon: '🔔',
        duration: 12000,
        position: 'top-right',
        style: {
          background: '#1E293B',
          color: '#F1F5F9',
          borderRadius: '12px',
        },
      });
    }
  }, [playNotificationSound, triggerVibration]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newVal = !prev;
      localStorage.setItem('admin_notification_sound', String(newVal));
      if (newVal && !audioUnlockedRef.current) {
        try {
          const ctx = getAudioContext();
          ctx.resume().then(() => {
            audioUnlockedRef.current = true;
          }).catch(() => {});
        } catch (e) {}
      }
      return newVal;
    });
  }, []);

  const toggleVibration = useCallback(() => {
    setVibrationEnabled(prev => {
      const newVal = !prev;
      localStorage.setItem('admin_notification_vibration', String(newVal));
      if (newVal && isVibrationSupported() && isVibrationUnlocked()) {
        vibrateForNotification('short');
      }
      return newVal;
    });
  }, []);

  const fetchNotifications = useCallback(async (page = 1, type = '') => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (type) params.type = type;
      const { data } = await api.get('/admin/notifications', { params });
      if (data.success) {
        const normalized = data.notifications.map(n => normalizeLink(n));
        setNotifications(normalized);
        setUnreadCount(data.unreadCount);
        normalized.forEach(n => {
          if (n._id) knownNotificationIds.current.add(n._id);
        });
      }
    } catch (error) {
      if (axios.isCancel(error)) return;
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('[Notification] Fetch error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error('[Notification] Mark as read error:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/admin/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[Notification] Mark all read error:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      setNotifications(prev => {
        const updated = prev.filter(n => n._id !== id);
        const removed = prev.find(n => n._id === id);
        if (removed && !removed.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return updated;
      });
    } catch (error) {
      console.error('[Notification] Delete error:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await api.delete('/admin/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
      knownNotificationIds.current.clear();
    } catch (error) {
      console.error('[Notification] Clear all error:', error);
    }
  }, []);

  const getUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/notifications/unread-count');
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.warn('[Notification] Unread count fetch error:', error);
      }
    }
  }, []);

  const joinAdminRoom = useCallback(() => {
    try {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('join_admin');
      }
    } catch (e) {
      console.warn('[Notification] joinAdminRoom error:', e);
    }
  }, []);

  const setupSocketListeners = useCallback(() => {
    const socket = getSocket();
    if (!socket) {
      return null;
    }

    const handleConnect = () => {
      socket.emit('join_admin');
    };

    const handleAdminNotification = (notification) => {
      if (!notification) return;
      const n = normalizeLink(notification);
      const isNew = addNotificationToState(n);
      if (isNew && !n.isRead) {
        triggerNotificationEffects(n);
      }
    };

    const handleNewOrder = (data) => {
      if (!data) return;
      const id = data.notificationId || `new_order_${data.orderId || Date.now()}`;
      if (knownNotificationIds.current.has(id)) return;
      if (data.orderId && knownNotificationIds.current.has(data.orderId)) return;

      const added = addNotificationToState({
        _id: id,
        title: data.title || 'New Order Received',
        message: data.message || `New order from ${data.customerName || 'a customer'}`,
        type: 'new_order',
        orderId: data.orderId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        itemsCount: data.itemsCount,
        paymentMethod: data.paymentMethod,
        link: '/orders',
        createdAt: data.timestamp || new Date().toISOString(),
        isRead: false,
      });

      if (added) {
        playNotificationSound();
        triggerVibration('new_order');
        setLatestNotification(data);
        toast('New Order Received!', {
          icon: '🛒',
          duration: 12000,
          position: 'top-right',
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            borderRadius: '12px',
          },
        });
      }
    };

    const handlePaymentSuccess = (data) => {
      if (!data) return;
      const id = data.notificationId || `payment_${data.orderId || Date.now()}`;
      if (knownNotificationIds.current.has(id)) return;
      knownNotificationIds.current.add(id);

      playNotificationSound();
      triggerVibration('payment_success');
      const notification = normalizeLink({
        _id: id,
        title: data.title || 'Payment Received',
        message: data.message || 'Payment has been successfully processed',
        type: 'payment_success',
        amount: data.amount,
        orderId: data.orderId,
        customerName: data.customerName,
        link: data.link,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
      addNotificationToState(notification);
      setLatestNotification(notification);
    };

    const handleUrgentAlert = (data) => {
      if (!data) return;
      const id = data.notificationId || `urgent_${Date.now()}`;
      if (knownNotificationIds.current.has(id)) return;
      knownNotificationIds.current.add(id);

      playNotificationSound();
      triggerVibration('urgent_alert');
      const notification = normalizeLink({
        _id: id,
        title: data.title || 'Urgent Alert',
        message: data.message || 'Immediate attention required',
        type: 'urgent_alert',
        link: data.link,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
      addNotificationToState(notification);
      setLatestNotification(notification);
    };

    const handleNewMessage = (data) => {
      if (!data) return;
      const id = data._id || `msg_${Date.now()}`;
      if (knownNotificationIds.current.has(id)) return;
      knownNotificationIds.current.add(id);
      const notification = normalizeLink({
        _id: id,
        title: `New Message from ${data.name || 'Guest'}`,
        message: data.subject || 'New contact message received',
        type: 'system',
        customerName: data.name,
        customerEmail: data.email,
        link: '/messages',
        createdAt: data.createdAt || new Date().toISOString(),
        isRead: false,
      });
      const isNew = addNotificationToState(notification);
      if (isNew) {
        playNotificationSound();
        triggerVibration('short');
        setLatestNotification(notification);
        toast(`New message from ${data.name || 'Guest'}`, {
          icon: '💬',
          duration: 12000,
          position: 'top-right',
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            borderRadius: '12px',
          },
        });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('admin_notification', handleAdminNotification);
    socket.on('new_order', handleNewOrder);
    socket.on('payment_success', handlePaymentSuccess);
    socket.on('urgent_alert', handleUrgentAlert);
    socket.on('new_message', handleNewMessage);

    if (socket.connected) {
      socket.emit('join_admin');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('admin_notification', handleAdminNotification);
      socket.off('new_order', handleNewOrder);
      socket.off('payment_success', handlePaymentSuccess);
      socket.off('urgent_alert', handleUrgentAlert);
      socket.off('new_message', handleNewMessage);
    };
  }, [addNotificationToState, triggerNotificationEffects, playNotificationSound, triggerVibration]);

  useEffect(() => {
    const cleanup = setupSocketListeners();
    listenerCleanupRef.current = cleanup;

    const unsubReconnect = onReconnect(() => {
      if (listenerCleanupRef.current) listenerCleanupRef.current();
      listenerCleanupRef.current = setupSocketListeners();
    });

    return () => {
      if (cleanup) cleanup();
      unsubReconnect();
    };
  }, [setupSocketListeners]);

  useEffect(() => {
    if (!latestNotification) return;
    const timer = setTimeout(() => setLatestNotification(null), 20000);
    return () => clearTimeout(timer);
  }, [latestNotification]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      getUnreadCount();
      joinAdminRoom();
    }, 30000);
    return () => clearInterval(interval);
  }, [getUnreadCount, joinAdminRoom]);

  const value = {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    vibrationEnabled,
    vibrationSupported,
    isMobile,
    latestNotification,
    toggleSound,
    toggleVibration,
    triggerNotificationEffects,
    triggerVibration,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
