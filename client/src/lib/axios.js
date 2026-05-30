import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

// Auth endpoints should never trigger a refresh-retry: a failed login/refresh/me
// is an expected 401, and retrying would double requests and risk a loop.
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me'];
const isAuthRequest = (url = '') => AUTH_PATHS.some((p) => url.includes(p));

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !isAuthRequest(original.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          failedQueue.push({ resolve, reject })
        ).then(() => api(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(original);
      } catch (e) {
        processQueue(e);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// Attach active workspace id so backend knows whose content is targeted.
api.interceptors.request.use((config) => {
  const ws = localStorage.getItem('scribble-active-workspace');
  if (ws && ws !== 'personal') config.headers['X-Workspace-Id'] = ws;
  return config;
});

export default api;
