import api from '../lib/axios.js';

export const usersApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/me/profile', data),
  getUserPosts: (username) => api.get(`/users/${username}/posts`),
  getFollowers: (username) => api.get(`/users/${username}/followers`),
  getFollowing: (username) => api.get(`/users/${username}/following`),
  toggleFollow: (username) => api.post(`/users/${username}/follow`),
};
