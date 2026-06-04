/**
 * Axios API Client — Admin Dashboard
 *
 * Features:
 *  - Automatic retry on network failures (up to 2 retries)
 *  - 401/403 auto-logout
 *  - Dev-mode logging
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
});

// ── Request interceptor ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  if (import.meta.env.DEV) {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
  }

  return config;
});

// ── Response interceptor ────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalConfig = error.config;

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // 401/403 → auto logout
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx (up to 2 retries)
    if (
      (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.response?.status >= 500) &&
      originalConfig &&
      !originalConfig._retry
    ) {
      originalConfig._retry = (originalConfig._retry || 0) + 1;
      if (originalConfig._retry <= 2) {
        // Exponential backoff: 1s → 2s
        const delay = originalConfig._retry * 1000;
        if (import.meta.env.DEV) {
          console.warn(`[API] Retry #${originalConfig._retry} for ${originalConfig.url} in ${delay}ms`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(originalConfig);
      }
    }

    // Dev-mode error logging
    if (import.meta.env.DEV) {
      console.error(`[API] Error ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response?.status || error.code, error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
