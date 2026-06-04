import { io as socketIO } from 'socket.io-client';

let socket = null;
let listenersAttached = false;
let pingIntervalId = null;
let reconnectCallbacks = [];
let discoveredPort = null;

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

export const isSocketConnected = () => {
  return socket !== null && (socket.connected || socket.connecting);
};

export const onReconnect = (callback) => {
  reconnectCallbacks.push(callback);
  return () => {
    reconnectCallbacks = reconnectCallbacks.filter(cb => cb !== callback);
  };
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
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : window.location.origin;
  }
  return import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : window.location.origin;
};

const createSocket = () => {
  const serverUrl = buildServerUrl();
  return socketIO(serverUrl, {
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

const attachListeners = (sock) => {
  if (listenersAttached) {
    sock.removeAllListeners('connect');
    sock.removeAllListeners('disconnect');
    sock.removeAllListeners('connect_error');
    sock.removeAllListeners('reconnect_attempt');
    sock.removeAllListeners('reconnect');
    sock.removeAllListeners('reconnect_error');
    sock.removeAllListeners('reconnect_failed');
  }
  listenersAttached = true;

  sock.on('connect', () => {
    const serverUrl = discoveredPort
      ? `http://localhost:${discoveredPort}`
      : window.location.origin;
    console.log(`[Socket] Admin connected: ${sock.id} (server: ${serverUrl})`);
    sock.emit('join_admin');
    startPingInterval(sock);
  });

  sock.on('disconnect', (reason) => {
    console.log(`[Socket] Admin disconnected: ${reason}`);
    clearPingInterval();
  });

  sock.on('connect_error', (error) => {
    if (error.type !== 'TransportError') {
      console.warn(`[Socket] Connection error: ${error.message}`);
    }
    const errMsg = (error.message || '').toLowerCase();
    if (
      (errMsg.includes('econnrefused') || errMsg.includes('xhr') || errMsg.includes('polling')) &&
      import.meta.env.DEV
    ) {
      discoverBackendPort().then((port) => {
        if (port && port !== discoveredPort) {
          console.log(`[Socket] Found backend on port ${port}, reconnecting...`);
          discoveredPort = port;
          if (socket) {
            socket.close();
            socket.removeAllListeners();
            socket = null;
            listenersAttached = false;
            getSocket();
            reconnectCallbacks.forEach(cb => cb());
          }
        }
      });
    }
  });

  sock.on('reconnect_attempt', (attempt) => {
    console.log(`[Socket] Reconnect attempt #${attempt}`);
  });

  sock.on('reconnect', (attempt) => {
    console.log(`[Socket] Reconnected after ${attempt} attempts`);
    sock.emit('join_admin');
    startPingInterval(sock);
    reconnectCallbacks.forEach(cb => cb());
  });

  sock.on('reconnect_error', (error) => {
    console.warn(`[Socket] Reconnect error: ${error.message}`);
  });

  sock.on('reconnect_failed', () => {
    console.error('[Socket] Reconnect failed');
    clearPingInterval();
  });
};

export const getSocket = () => {
  if (socket) {
    return socket;
  }

  socket = createSocket();
  attachListeners(socket);

  if (import.meta.env.DEV && !discoveredPort) {
    discoverBackendPort().then((port) => {
      if (port) {
        discoveredPort = port;
      }
    });
  }

  return socket;
};

export const onSocketEvent = (event, handler) => {
  const s = getSocket();
  s.on(event, handler);
  return () => {
    if (socket) {
      socket.off(event, handler);
    }
  };
};

export const disconnectSocket = () => {
  if (socket) {
    clearPingInterval();
    socket.removeAllListeners();
    socket.emit('leave_admin');
    socket.close();
    socket = null;
    listenersAttached = false;
    reconnectCallbacks = [];
    discoveredPort = null;
  }
};

export default getSocket;
