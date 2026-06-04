const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE.replace(/\/api$/, '');

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return SERVER_BASE + path;
  if (path.startsWith('uploads/')) return SERVER_BASE + '/' + path;
  if (path.startsWith('data:')) return path;
  return SERVER_BASE + '/' + path.replace(/^\/+/, '');
};