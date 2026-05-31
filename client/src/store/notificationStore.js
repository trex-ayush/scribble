import { create } from 'zustand';
import { notificationsApi } from '../api/notifications.js';

// In-app notifications for the logged-in user. The Navbar bell polls the
// unread count; opening the dropdown loads the latest items.
export const notificationStore = create((set, get) => ({
  items: [],
  unread: 0,
  loading: false,

  async fetchUnreadCount() {
    try {
      const { data } = await notificationsApi.getUnreadCount();
      set({ unread: data.data.unread });
    } catch { /* ignore */ }
  },

  async fetchList() {
    set({ loading: true });
    try {
      const { data } = await notificationsApi.list();
      set({ items: data.data.items, unread: data.data.unread });
    } catch { /* ignore */ } finally {
      set({ loading: false });
    }
  },

  async markRead(id) {
    // Optimistic: flip the item locally, then reconcile the count from the API.
    set((s) => ({
      items: s.items.map((n) => (n._id === id ? { ...n, read: true } : n)),
    }));
    try {
      const { data } = await notificationsApi.markRead(id);
      set({ unread: data.data.unread });
    } catch { /* ignore */ }
  },

  async markAllRead() {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unread: 0 }));
    try { await notificationsApi.markAllRead(); } catch { /* ignore */ }
  },

  reset() {
    set({ items: [], unread: 0, loading: false });
  },
}));
