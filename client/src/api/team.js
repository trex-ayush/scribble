import api from '../lib/axios.js';

export const teamApi = {
  getTeam: () => api.get('/team'),
  addMember: (username, role) => api.post('/team/members', { username, role }),
  removeMember: (memberId) => api.delete(`/team/members/${memberId}`),
  updateRole: (memberId, role) => api.patch(`/team/members/${memberId}/role`, { role }),
  getMyTeams: () => api.get('/team/mine'),
  logAccess: (ownerId) => api.post(`/team/access/${ownerId}`),
};
