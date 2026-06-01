import { create } from 'zustand';
import { bookmarksApi } from '../api/bookmarks.js';

// Set of post ids the current user has bookmarked, so any PostCard / PostDetail
// can show the saved state without each fetching its own status.
export const bookmarkStore = create((set, get) => ({
  ids: new Set(),

  async loadIds() {
    try {
      const { data } = await bookmarksApi.getIds();
      set({ ids: new Set(data.data.ids) });
    } catch { /* ignore */ }
  },

  isBookmarked(postId) {
    return get().ids.has(postId);
  },

  // Optimistically flip, then reconcile with the server's truth.
  async toggle(postId) {
    const had = get().ids.has(postId);
    const optimistic = new Set(get().ids);
    had ? optimistic.delete(postId) : optimistic.add(postId);
    set({ ids: optimistic });

    try {
      const { data } = await bookmarksApi.toggle(postId);
      const next = new Set(get().ids);
      data.data.bookmarked ? next.add(postId) : next.delete(postId);
      set({ ids: next });
      return data.data.bookmarked;
    } catch {
      // Revert on failure.
      const reverted = new Set(get().ids);
      had ? reverted.add(postId) : reverted.delete(postId);
      set({ ids: reverted });
      throw new Error('toggle failed');
    }
  },

  reset() {
    set({ ids: new Set() });
  },
}));
