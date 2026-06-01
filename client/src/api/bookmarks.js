import api from '../lib/axios.js';

export const bookmarksApi = {
  list: (params) => api.get('/bookmarks', { params }),
  getIds: () => api.get('/bookmarks/ids'),
  toggle: (postId) => api.post(`/bookmarks/${postId}`),
};
