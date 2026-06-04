import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { initializeSocket, joinUserRoom, leaveUserRoom, getSocket, disconnectSocket } from '../services/socket.js';

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
        console.warn('[UserNotification] Sound playback failed:', e);
      }
    });
  } catch (e) {
    console.warn('[UserNotification] Sound playback failed:', e);
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('user_notification_sound') !== 'false';
  });
  const audioUnlockedRef = useRef(false);
  const socketListenersRef = useRef(null);
  const knownIds = useRef(new Set());
  const mountedRef = useRef(false);

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('user_notification_sound', String(next));
      return next;
    });
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    playNotificationSoundFx();
  }, [soundEnabled]);

  useEffect(() => {
    const unlock = () => {
      if (!audioUnlockedRef.current) {
        try {
          const ctx = getAudioContext();
          ctx.resume().then(() => {
            audioUnlockedRef.current = true;
          }).catch(() => {});
        } catch (e) {}
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

  const setupSocket = useCallback((userId) => {
    if (!userId) return;

    const socket = initializeSocket();
    if (!socket) return;

    if (socketListenersRef.current) {
      const { cleanup } = socketListenersRef.current;
      if (cleanup) cleanup();
    }

    const handleNotification = (notification) => {
      if (!notification) return;
      const id = notification._id;
      if (id && knownIds.current.has(id)) return;
      if (id) knownIds.current.add(id);

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      playSound();

      if (notification.title) {
        toast(notification.title, {
          icon: '🔔',
          duration: 8000,
          position: 'top-right',
          style: {
            borderRadius: '12px',
            background: '#1F2937',
            color: '#F3F4F6',
            border: '1px solid #374151',
          },
        });
      }
    };

    const handleOrderUpdate = (data) => {
      if (!data) return;
      const orderId = data.orderId;
      if (orderId && knownIds.current.has(orderId)) return;
      if (orderId) knownIds.current.add(orderId);

      setNotifications((prev) => {
        if (prev.some((n) => n.message?.includes(data.orderId))) return prev;
        return [
          {
            _id: `order_${data.orderId}_${Date.now()}`,
            title: 'Order Update',
            message: data.message,
            type: 'order',
            isRead: false,
            createdAt: new Date().toISOString(),
            link: `/orders/${data.orderId}`,
          },
          ...prev,
        ];
      });
      setUnreadCount((prev) => prev + 1);
      playSound();

      toast(data.message || 'Order status updated', {
        icon: '📦',
        duration: 8000,
        position: 'top-right',
        style: {
          borderRadius: '12px',
          background: '#1F2937',
          color: '#F3F4F6',
          border: '1px solid #374151',
        },
      });
    };

    const handleConnect = () => {
      joinUserRoom(userId);
    };

    socket.on('connect', handleConnect);
    socket.on('user_notification', handleNotification);
    socket.on('order_update', handleOrderUpdate);

    if (socket.connected) {
      joinUserRoom(userId);
    }

    const cleanup = () => {
      socket.off('connect', handleConnect);
      socket.off('user_notification', handleNotification);
      socket.off('order_update', handleOrderUpdate);
    };

    socketListenersRef.current = { cleanup };

    return cleanup;
  }, [playSound]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      if (user?._id) {
        leaveUserRoom(user._id);
      }
      if (socketListenersRef.current) {
        const { cleanup } = socketListenersRef.current;
        if (cleanup) cleanup();
        socketListenersRef.current = null;
      }
      if (!mountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
      }
      return;
    }

    const cleanup = setupSocket(user._id);

    return () => {
      if (cleanup) cleanup();
    };
  }, [isAuthenticated, user?._id, setupSocket]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const { data } = await api.get('/notifications?limit=50');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        (data.notifications || []).forEach((n) => {
          if (n._id) knownIds.current.add(n._id);
        });
      }
    } catch (err) {
      if (err.code !== 'ERR_NETWORK' && err.code !== 'ERR_CANCELED') console.error('[UserNotification] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    if (mountedRef.current) return;
    mountedRef.current = true;
    fetchNotifications();
  }, [isAuthenticated, user?._id, fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchNotifications();
      try {
        if (isAuthenticated && user?._id) joinUserRoom(user._id);
      } catch (e) {}
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?._id, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[UserNotification] Mark read error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[UserNotification] Mark all read error:', err);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    toggleSound,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationProvider;
