import api from '../lib/axios.js';

export const apiKeysApi = {
  getSettings: () => api.get('/api-keys'),
  generate: () => api.post('/api-keys/generate'),
  toggle: (enabled) => api.patch('/api-keys/toggle', { enabled }),
  revoke: () => api.delete('/api-keys'),
};
