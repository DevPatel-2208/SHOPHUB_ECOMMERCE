import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;
let isConnecting = false;

const connectRedis = async () => {
  // Prevent duplicate initialization if already connected or connecting
  if (redisClient && (isConnected || isConnecting)) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  // In production, if REDIS_URL is not configured, fall back safely without connection attempts
  if (!redisUrl && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ REDIS_URL environment variable is not defined. Redis caching disabled (running in no-cache mode).');
    isConnected = false;
    isConnecting = false;
    return null;
  }

  const targetUrl = redisUrl || 'redis://localhost:6379';

  try {
    isConnecting = true;
    redisClient = createClient({
      url: targetUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('⚠️ Redis: Max reconnection attempts reached. Falling back to no-cache mode.');
            return false; // Stop reconnecting cleanly
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000,
      },
    });

    redisClient.on('error', (err) => {
      console.warn('Redis Client Error:', err?.message || err || 'Connection failed');
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
      isConnecting = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redisClient.on('end', () => {
      isConnected = false;
      isConnecting = false;
    });

    await redisClient.connect();
    isConnected = true;
    isConnecting = false;
    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis connection failed. Running without cache:', error?.message || error);
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.disconnect();
      }
    } catch (_) {
      // Ignore disconnect error during cleanup
    }
    redisClient = null;
    isConnected = false;
    isConnecting = false;
    return null;
  }
};

// Graceful shutdown
const disconnectRedis = async () => {
  if (redisClient) {
    try {
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
    } catch (err) {
      console.warn('Redis disconnect error:', err.message);
    } finally {
      redisClient = null;
      isConnected = false;
      isConnecting = false;
      console.log('✅ Redis disconnected');
    }
  }
};

// Cache helpers with fallback when Redis is unavailable
export const getCache = async (key) => {
  if (!redisClient || !isConnected) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Redis getCache error:', error.message);
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = 3600) => {
  if (!redisClient || !isConnected) return false;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Redis setCache error:', error.message);
    return false;
  }
};

export const deleteCache = async (key) => {
  if (!redisClient || !isConnected) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.warn('Redis deleteCache error:', error.message);
    return false;
  }
};

export const deleteCacheByPattern = async (pattern) => {
  if (!redisClient || !isConnected) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.warn('Redis deleteCacheByPattern error:', error.message);
    return false;
  }
};

export const getRedisClient = () => redisClient;
export const isRedisConnected = () => isConnected;

export { connectRedis, disconnectRedis };
export default {
  connectRedis,
  disconnectRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  getRedisClient,
  isRedisConnected,
};
