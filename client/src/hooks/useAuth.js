import { useAuthStore } from '../store/authStore.js';

export const useAuth = () => {
  const { user, isAuthenticated, login, register, logout, fetchMe, setUser } = useAuthStore();
  return { user, isAuthenticated, login, register, logout, fetchMe, setUser };
};
