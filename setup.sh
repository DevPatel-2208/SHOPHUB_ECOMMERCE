#!/bin/bash

echo "🚀 E-Commerce Setup Script"
echo "=========================="

# Backend
echo "📦 Setting up Backend..."
cd backend
npm install
cp .env.example .env
echo "✅ Backend dependencies installed. Please edit .env file with your credentials."
cd ..

# Frontend User
echo "📦 Setting up User Frontend..."
cd frontend-user
npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "✅ User frontend dependencies installed."
cd ..

# Frontend Admin
echo "📦 Setting up Admin Frontend..."
cd frontend-admin
npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "✅ Admin frontend dependencies installed."
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  1. Edit backend/.env with your credentials"
echo "  2. Start MongoDB and Redis"
echo "  3. Run: cd backend && npm run dev"
echo "  4. Run: cd frontend-user && npm run dev"
echo "  5. Run: cd frontend-admin && npm run dev"
