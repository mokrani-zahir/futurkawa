import axios from 'axios';

// window.__ENV__.API_URL is injected at container startup (see
// frontend/docker-entrypoint.sh) from the frontend's own .env file, so the
// same built image can point at any backend without a rebuild. Falls back to
// the relative path when unset (dev server, or prod behind a shared proxy).
const api = axios.create({
  baseURL: window.__ENV__?.API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach stored Bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear credentials and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config._isRetry) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
