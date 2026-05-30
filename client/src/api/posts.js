import api from '../lib/axios.js';

export const postsApi = {
  getFeed: (params) => api.get('/posts', { params }),
  getPost: (slug) => api.get(`/posts/${slug}`),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  toggleClap: (id) => api.post(`/posts/${id}/clap`),
  getMyDrafts: () => api.get('/posts/drafts'),
  getTags: () => api.get('/posts/tags'),
  getEditable: (id) => api.get(`/posts/${id}/edit`),
  getComments: (slug) => api.get(`/posts/${slug}/comments`),
  addComment: (slug, content) => api.post(`/posts/${slug}/comments`, { content }),
  deleteComment: (id) => api.delete(`/posts/comments/${id}`),
};
