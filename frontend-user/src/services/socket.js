import { io } from 'socket.io-client';

let socket = null;
let discoveredPort = null;
let pingIntervalId = null;

const PORTS_TO_TRY = [5000, 5001, 5002, 5003];

const clearPingInterval = () => {
  if (pingIntervalId !== null) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
};

const startPingInterval = (sock) => {
  clearPingInterval();
  pingIntervalId = setInterval(() => {
    if (sock?.connected) {
      sock.emit('ping_server');
    } else {
      clearPingInterval();
    }
  }, 25000);
};

const discoverBackendPort = async () => {
  for (const port of PORTS_TO_TRY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const resp = await fetch(`http://localhost:${port}/api/server-info`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        return data.port;
      }
    } catch {
      continue;
    }
  }
  return null;
};

const buildServerUrl = () => {
  if (discoveredPort) {
    return `http://localhost:${discoveredPort}`;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  return window.location.origin;
};

const createSocket = () => {
  const url = buildServerUrl();
  return io(url, {
    withCredentials: true,
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.3,
    timeout: 20000,
    closeOnBeforeunload: false,
  });
};

const initializeSocket = () => {
  if (!socket) {
    socket = createSocket();

    socket.on('connect', () => {
      console.log('[UserSocket] Connected:', socket.id);
      startPingInterval(socket);
    });

    socket.on('disconnect', (reason) => {
      console.log('[UserSocket] Disconnected:', reason);
      clearPingInterval();
    });

    socket.on('connect_error', (error) => {
      if (error.type !== 'TransportError') {
        console.warn('[UserSocket] Connection error:', error.message);
      }
      const errMsg = (error.message || '').toLowerCase();
      if (
        (errMsg.includes('econnrefused') || errMsg.includes('xhr') || errMsg.includes('polling')) &&
        import.meta.env.DEV
      ) {
        discoverBackendPort().then((port) => {
          if (port && port !== discoveredPort) {
            console.log('[UserSocket] Found backend on port', port);
            discoveredPort = port;
            socket.close();
            socket.removeAllListeners();
            socket = null;
            clearPingInterval();
            initializeSocket();
          }
        });
      }
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[UserSocket] Reconnect attempt #' + attempt);
    });

    socket.on('reconnect', (attempt) => {
      console.log('[UserSocket] Reconnected after', attempt, 'attempts');
      startPingInterval(socket);
    });

    socket.on('reconnect_error', (error) => {
      console.warn('[UserSocket] Reconnect error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('[UserSocket] Reconnect failed');
      clearPingInterval();
    });
  }
  return socket;
};

const getSocket = () => socket;

const joinUserRoom = (userId) => {
  if (socket && socket.connected) {
    socket.emit('join_user', userId);
  }
};

const leaveUserRoom = (userId) => {
  if (socket && socket.connected) {
    socket.emit('leave_user', userId);
  }
};

const disconnectSocket = () => {
  if (socket) {
    clearPingInterval();
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    discoveredPort = null;
  }
};

const onOrderUpdate = (callback) => {
  if (socket) socket.on('order_update', callback);
};

const onNewNotification = (callback) => {
  if (socket) socket.on('user_notification', callback);
};

export {
  initializeSocket,
  getSocket,
  joinUserRoom,
  leaveUserRoom,
  disconnectSocket,
  onOrderUpdate,
  onNewNotification,
};
