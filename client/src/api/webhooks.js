import api from '../lib/axios.js';

export const webhooksApi = {
  listEvents: () => api.get('/webhooks/events'),
  list: () => api.get('/webhooks'),
  getOne: (id) => api.get(`/webhooks/${id}`),
  create: (payload) => api.post('/webhooks', payload),
  update: (id, payload) => api.patch(`/webhooks/${id}`, payload),
  rotateSecret: (id) => api.post(`/webhooks/${id}/rotate-secret`),
  test: (id) => api.post(`/webhooks/${id}/test`),
  remove: (id) => api.delete(`/webhooks/${id}`),
  listDeliveries: (params) => api.get('/webhooks/deliveries', { params }),
  getDelivery: (id) => api.get(`/webhooks/deliveries/${id}`),
};
