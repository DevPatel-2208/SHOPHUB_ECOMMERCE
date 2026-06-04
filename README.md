# 🛒 E-Commerce MERN Application

This repository contains a full-stack e-commerce project built with:
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **User frontend:** React, Vite, Tailwind CSS
- **Admin dashboard:** React, Vite, Tailwind CSS

The app includes product listing, cart, checkout, payments, admin management, notifications, and more.

## 📁 Repository Structure

```
ecommerce-app/
├── backend/
│   ├── config/          # DB, Redis, email, passport, Cashfree
│   ├── controllers/     # Route handlers and business logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth, validation, upload, rate limiting
│   ├── utils/           # Helpers, email, invoice, search
│   ├── sockets/         # Socket.io handlers
│   ├── server.js        # App entry point
│   └── package.json
│
├── frontend-user/       # Customer-facing React app
│   ├── src/
│   ├── public/
│   └── package.json
│
├── frontend-admin/      # Admin dashboard React app
│   ├── src/
│   ├── public/
│   └── package.json
│
└── .gitignore
```

## 🚀 Features

### User app
- Authentication with email/password, Google OAuth, JWT, OTP
- Product catalog with search, filters, categories, and pagination
- Shopping cart, wishlist, coupon support
- Checkout flow with Cashfree payment integration
- Order tracking, invoice generation, notifications
- Responsive UI with light/dark mode support

### Admin app
- Dashboard for orders, users, products, coupons, categories
- Analytics cards and charts
- Product CRUD, stock management, shipment tracking
- Notifications and order status updates

### Backend
- REST API built with Express
- MongoDB database and Mongoose models
- Redis support for caching and sessions
- Email notifications via Nodemailer
- Cloudinary image uploads
- Socket.io real-time updates
- Payment integration with Cashfree

## 🛠 Prerequisites

- Node.js >= 22
- MongoDB (local or Atlas)
- Redis (local or cloud)

## 🔧 Installation

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Update backend/.env with your values
npm run dev
```

### 2. User frontend

```bash
cd frontend-user
npm install
# Create a .env file for Vite
# Example:
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

### 3. Admin frontend

```bash
cd frontend-admin
npm install
# Create a .env file for Vite
# Example:
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

## ⚙️ Environment Variables

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=you@example.com
SMTP_PASSWORD=your_email_password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CASHFREE_APP_ID=...
CASHFREE_SECRET_KEY=...
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

### Frontends `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

## 📦 Scripts

### Backend
- `npm run dev` — start backend with nodemon
- `npm start` — run backend in production mode
- `npm run seed` — seed sample data

### Frontend apps
- `npm run dev` — start development server
- `npm run build` — build production output
- `npm run preview` — preview production build
- `npm run lint` — lint code in `frontend-user`

## ✅ Recommended local workflow

1. Start MongoDB and Redis.
2. Run backend:
   ```bash
   cd backend
   npm run dev
   ```
3. Run user app:
   ```bash
   cd frontend-user
   npm run dev
   ```
4. Run admin app:
   ```bash
   cd frontend-admin
   npm run dev
   ```

## 📌 Notes

- Do not commit `.env` files.
- Each subproject has its own `package.json` and dependencies.
- Backend must be running before using either frontend.

## 🎯 Useful URLs

- Backend API: `http://localhost:5000/api`
- User frontend: `http://localhost:5173`
- Admin frontend: `http://localhost:5174`
