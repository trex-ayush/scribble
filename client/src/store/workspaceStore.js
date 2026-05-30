import { create } from 'zustand';
import { teamApi } from '../api/team.js';

// Plain localStorage key read by the axios interceptor (kept in sync below).
const ACTIVE_KEY = 'scribble-active-workspace';

export const getActiveWorkspaceId = () => {
  const v = localStorage.getItem(ACTIVE_KEY);
  return v && v !== 'personal' ? v : null;
};

export const workspaceStore = create((set, get) => ({
  // null = personal workspace; otherwise { ownerId, username, name, role }
  active: null,
  workspaces: [], // teams the user has accepted membership in

  async loadWorkspaces() {
    try {
      const { data } = await teamApi.getMyTeams();
      const workspaces = data.data.teams.map((t) => ({
        ownerId: t.owner._id,
        username: t.owner.username,
        name: t.owner.name || t.owner.username,
        role: t.role,
      }));
      set({ workspaces });

      // If the persisted active workspace is no longer valid, reset to personal.
      const activeId = getActiveWorkspaceId();
      if (activeId && !workspaces.find((w) => w.ownerId === activeId)) {
        get().switchTo(null);
      } else if (activeId) {
        set({ active: workspaces.find((w) => w.ownerId === activeId) || null });
      }
    } catch { /* ignore */ }
  },

  switchTo(workspace) {
    if (!workspace) {
      localStorage.setItem(ACTIVE_KEY, 'personal');
      set({ active: null });
    } else {
      localStorage.setItem(ACTIVE_KEY, workspace.ownerId);
      set({ active: workspace });
    }
  },

  reset() {
    localStorage.removeItem(ACTIVE_KEY);
    set({ active: null, workspaces: [] });
  },
}));
