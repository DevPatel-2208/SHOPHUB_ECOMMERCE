// Resolves image URLs: local upload paths get the backend server URL prepended,
// full URLs (Cloudinary, etc.) are returned as-is.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE.replace(/\/api$/, ''); // strip /api → http://localhost:5000

export const getImageUrl = (path) => {
  if (!path) return '';
  // Already a full URL (Cloudinary, Unsplash, etc.)
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Local upload path with leading slash
  if (path.startsWith('/uploads/')) return SERVER_BASE + path;
  // Local upload path without leading slash (e.g. "uploads/ecommerce/...")
  if (path.startsWith('uploads/')) return SERVER_BASE + '/' + path;
  // Data URI
  if (path.startsWith('data:')) return path;
  // Fallback: prepend server base
  return SERVER_BASE + '/' + path.replace(/^\/+/, '');
};