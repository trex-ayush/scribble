import api from '../lib/axios.js';

export const activityApi = {
  getLogs: (page = 1, limit) => api.get('/activity', { params: { page, limit } }),
};
