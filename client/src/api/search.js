import api from '../lib/axios.js';

export const searchApi = {
  // Combined type-ahead: { posts, users }. Pass an AbortSignal so an in-flight
  // request can be cancelled when the query changes.
  suggest: (q, signal) => api.get('/search/suggest', { params: { q }, signal }),
};
