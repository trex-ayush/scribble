import React from 'react';
import { LogOut, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { workspaceStore } from '../../store/workspaceStore.js';

const ROLE_LABEL = { full: 'full access', read: 'read-only' };

// Hand-drawn "you're viewing someone else's account" bar.
export const WorkspaceBanner = () => {
  const { user } = useAuth();
  const active = workspaceStore((s) => s.active);

  if (!active) return null;

  const exit = () => {
    workspaceStore.getState().switchTo(null);
    window.location.href = '/';
  };

  return (
    <div className="relative z-[60] bg-postit border-b-[3px] border-dashed border-pencil">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-center gap-3 flex-wrap">
        <span className="flex items-center gap-2 font-body text-sm text-pencil">
          <Eye size={16} strokeWidth={2.5} className="text-accent shrink-0" />
          You're peeking into{' '}
          <span className="font-heading text-base -rotate-1 inline-block underline decoration-wavy decoration-accent/50">
            {active.name}'s
          </span>{' '}
          desk
          <span className="font-body text-xs text-pencil/50">({ROLE_LABEL[active.role]})</span>
        </span>
        <button
          onClick={exit}
          className="flex items-center gap-1.5 px-3 py-1 font-body text-sm bg-white text-pencil border-2 border-pencil shadow-[2px_2px_0px_0px_#2d2d2d]
                     hover:bg-accent hover:text-paper hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
          style={{ borderRadius: '10px 4px 10px 4px / 4px 10px 4px 10px' }}
        >
          <LogOut size={14} strokeWidth={2.5} />
          Back to my desk
        </button>
      </div>
    </div>
  );
};
