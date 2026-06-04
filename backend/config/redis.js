import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('Redis: Max reconnection attempts reached. Falling back to no-cache mode.');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.warn('Redis Client Error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    await redisClient.connect();
    isConnected = true;
  } catch (error) {
    console.warn('⚠️ Redis connection failed. Running without cache:', error.message);
    redisClient = null;
    isConnected = false;
  }
};

// Graceful shutdown
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('Redis disconnected');
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
    if (keys.length > 0) {
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
export default { connectRedis, disconnectRedis, getCache, setCache, deleteCache, deleteCacheByPattern, getRedisClient, isRedisConnected };