import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios.js';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        set({ user: data.data.user, isAuthenticated: true });
        return data.data.user;
      },

      register: async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        set({ user: data.data.user, isAuthenticated: true });
        return data.data.user;
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch { /* ignore */ }
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data.user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
