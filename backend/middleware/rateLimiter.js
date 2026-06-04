import rateLimit from 'express-rate-limit';

// Higher limits in development to prevent 429s during HMR / hot-reload
const isDev = process.env.NODE_ENV === 'development';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,
  message: { success: false, message: 'Too many auth attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 20,
  message: { success: false, message: 'Too many payment attempts' },
});
