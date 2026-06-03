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

// Auth endpoints should never trigger a refresh-retry: a failed login/register/
// refresh/logout is an expected 401, and retrying would double requests or loop.
// (`/auth/me` is intentionally NOT here, so an expired-token 401 on boot refreshes
// and the user stays logged in.)
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
const isAuthRequest = (url = '') => AUTH_PATHS.some((p) => url.includes(p));

// Serialize refresh across ALL tabs of the browser (they share the refresh
// cookie). Without this, two tabs refreshing at once make the server rotate the
// token twice and treat the second as reuse → it revokes the session and logs
// the user out everywhere. The Web Lock guarantees one refresh at a time.
const refreshTokens = () =>
  typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('scribble-auth-refresh', () => api.post('/auth/refresh'))
    : api.post('/auth/refresh');

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
        await refreshTokens();
        processQueue(null);
        return api(original);
      } catch (e) {
        processQueue(e);
        // Refresh failed (session revoked/expired) — drop to logged-out state.
        // Dynamic import avoids a static cycle (authStore imports this module).
        import('../store/authStore.js')
          .then(({ useAuthStore }) => useAuthStore.getState().setUser(null))
          .catch(() => {});
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
