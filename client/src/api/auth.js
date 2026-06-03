import api from '../lib/axios.js';

export const authApi = {
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}`),
  revokeOthers: () => api.delete('/auth/sessions/others'),
};
