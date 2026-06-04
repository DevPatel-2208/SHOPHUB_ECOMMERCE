/**
 * Ecommerce Backend Server
 *
 * Features:
 *  - Dynamic port detection with auto-fallback (5000 → 5001 → 5002 → 5003)
 *  - Prevents EADDRINUSE crashes — never exits on occupied port
 *  - Writes active port to .active-port for frontend Vite proxy discovery
 *  - Graceful shutdown (SIGTERM / SIGINT)
 *  - Production-ready error handling
 *  - Nodemon restart safe — no crash loops from port conflicts
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import hpp from 'hpp';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import passport from 'passport';
import { initGoogleStrategy } from './config/passport.js';
import cron from 'node-cron';

// ── Dirname (ESM-compatible) ──────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
import connectDB from './config/db.js';

// Middleware
import { apiLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import subscriberRoutes from './routes/subscriberRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// Utils
import { checkLowStock } from './utils/stockAlert.js';
import { initializeSockets } from './sockets/socketHandler.js';

const app = express();

// ── Active Port Tracking ──────────────────────────────────────────
// Shared state — set once a free port is found
let ACTIVE_PORT = null;

// ── Dynamic Port Detection ────────────────────────────────────────
// Range of ports to try (configurable via PORT_RANGE in .env)
const PORT_RANGE = (process.env.PORT_RANGE || '5000-5003').split('-').map(Number);
const START_PORT = PORT_RANGE[0] || 5000;
const END_PORT   = PORT_RANGE[1] || 5003;

/**
 * Probe whether a port is available by briefly listening on it.
 * Returns true if the port is free, false if occupied.
 */
const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', (err) => {
      server.close(() => resolve(false));
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });

/**
 * Find the first available port in the configured range.
 * Throws if none are free.
 */
const findAvailablePort = async (start, end) => {
  for (let port = start; port <= end; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    if (port !== start) {
      console.log(`⚠️  Port ${port} is busy, trying ${port + 1}...`);
    }
  }
  throw new Error(
    `❌ All ports ${start}–${end} are in use. Free one or update PORT_RANGE in .env`
  );
};

/**
 * Write the active port to a JSON file so frontend Vite configs can
 * discover it for proxy target and Socket.IO URL derivation.
 */
const writeActivePortFile = (port) => {
  try {
    const filePath = path.join(__dirname, '.active-port');
    fs.writeFileSync(filePath, JSON.stringify({ port, timestamp: Date.now() }), 'utf-8');
    console.log(`📝 Active port written to .active-port (port ${port})`);
  } catch (err) {
    console.warn(`⚠️  Could not write .active-port file: ${err.message}`);
  }
};

// ── Create HTTP Server ────────────────────────────────────────────
const httpServer = http.createServer(app);

// ── Socket.IO Configuration ──────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      process.env.ADMIN_URL || 'http://localhost:5174',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  },
  // WebSocket stability settings
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  connectTimeout: 30000,
  // Immediately upgrade to WebSocket when possible
  allowUpgrades: true,
  cookie: false,
});

// Make io accessible in controllers
app.set('io', io);

// ── Security Middleware ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", `http://localhost:${START_PORT}`],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(hpp());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body Parsers ──────────────────────────────────────────────────
// webhook needs raw body for HMAC verification
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook' && req.method === 'POST') {
    return express.raw({ type: 'application/json' })(req, res, next);
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// ── Static Files ──────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── Logging ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate Limiting ─────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    port: ACTIVE_PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Server Info Endpoint ──────────────────────────────────────────
// Returns the active backend port so frontend can discover it at runtime.
app.get('/api/server-info', (req, res) => {
  res.json({
    port: ACTIVE_PORT,
    serverUrl: `http://localhost:${ACTIVE_PORT}`,
  });
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/contact', contactRoutes);

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Initialize Sockets ────────────────────────────────────────────
initializeSockets(io);

// ── Cron Jobs ─────────────────────────────────────────────────────
cron.schedule('0 * * * *', () => {
  console.log('⏰ Running stock check...');
  checkLowStock();
});

// ── Connect DB & Start Server ─────────────────────────────────────
connectDB();

/**
 * Safely start the HTTP server on the first available port.
 *
 * How it works:
 *  1. Probes ports START_PORT → END_PORT (default 5000 → 5003).
 *  2. If a port is free, starts the server on it.
 *  3. If all ports are busy, logs a clear message (does NOT crash).
 *  4. Writes the active port to .active-port for Vite proxy discovery.
 *  5. Dynamically updates env vars that reference the server URL.
 */
const startServer = async () => {
  try {
    // ── Find available port ──────────────────────────────────────
    ACTIVE_PORT = await findAvailablePort(START_PORT, END_PORT);

    // ── Update runtime env vars that depend on the port ──────────
    process.env.ACTIVE_PORT = String(ACTIVE_PORT);
    const serverUrl = `http://localhost:${ACTIVE_PORT}`;

    // Update dependent env vars so downstream code uses the right URL
    if (!process.env.SERVER_URL || process.env.SERVER_URL.includes(`:${START_PORT}`)) {
      process.env.SERVER_URL = serverUrl;
    }
    if (!process.env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL.includes(`:${START_PORT}`)) {
      process.env.GOOGLE_CALLBACK_URL = `${serverUrl}/api/auth/google/callback`;
    }

    // Initialize Google OAuth strategy with the correct callback URL
    initGoogleStrategy();

    // ── Persist active port for frontend discovery ───────────────
    writeActivePortFile(ACTIVE_PORT);

    // ── Start listening ──────────────────────────────────────────
    httpServer.listen(ACTIVE_PORT, () => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🚀  Server running on port ${ACTIVE_PORT}`);
      console.log(`🌐  URL: ${serverUrl}`);
      console.log(`📱  Client URL: ${process.env.CLIENT_URL}`);
      console.log(`🔧  Admin URL:  ${process.env.ADMIN_URL}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });

    // ── Server-level error handler (post-listen) ─────────────────
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        // This should rarely happen since we already probed, but
        // handle it gracefully — log and keep running if possible.
        console.error(`❌ Port ${ACTIVE_PORT} became occupied after probe.`);
        console.error('   Restart the server to trigger port fallback.');
      } else {
        console.error('❌ Server error:', error.message);
      }
    });

  } catch (error) {
    // ── All ports exhausted — log clearly, DO NOT crash ─────────
    console.error(`\n❌ ${error.message}`);
    console.error('   💡 To fix:');
    console.error('      1. Kill processes using those ports, OR');
    console.error('      2. Update PORT_RANGE in backend/.env (e.g. PORT_RANGE=5000-5010)');
    console.error('   ⚠️  Server did not crash — fix the issue and restart.\n');

    // Do NOT process.exit(1) — prevents nodemon crash loops.
    // The process stays alive so nodemon doesn't restart infinitely.
  }
};

// ── Bootstrap ─────────────────────────────────────────────────────
startServer();

// ── Graceful Shutdown ─────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

  // Clean up .active-port file
  try {
    const filePath = path.join(__dirname, '.active-port');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🧹 Cleaned up .active-port file.');
    }
  } catch (_) { /* ignore cleanup errors */ }

  // Close Socket.IO first
  io.close(() => {
    console.log('✅ Socket.IO closed.');

    // Then close HTTP server
    httpServer.close(() => {
      console.log('✅ HTTP server closed.');
      mongoose.connection.close(false).then(() => {
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
      }).catch(() => process.exit(0));
    });
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(0);  // exit(0) — not an error
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections — log but don't crash
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  console.error(err.stack);
  // Don't crash — just log. Prevents nodemon restart loops.
});

// Handle uncaught exceptions — log but don't crash
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't crash — just log. Prevents nodemon restart loops.
});
