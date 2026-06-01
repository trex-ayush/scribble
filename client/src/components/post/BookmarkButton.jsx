import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { bookmarkStore } from '../../store/bookmarkStore.js';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Toggle a post in the reading list.
 * - variant="icon": compact icon-only button (post cards).
 * - variant="full": icon + label (post detail action bar).
 */
export const BookmarkButton = ({ postId, variant = 'icon', className = '' }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  // Subscribe to just this post's saved state so the button re-renders on toggle.
  const saved = bookmarkStore((s) => s.ids.has(postId));
  const toggle = bookmarkStore((s) => s.toggle);

  const handle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login');
    toggle(postId).catch(() => {});
  };

  const label = saved ? 'Saved' : 'Save';

  if (variant === 'full') {
    return (
      <button
        onClick={handle}
        aria-pressed={saved}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 border-2 font-body text-sm transition-all duration-100 wobbly-btn',
          saved
            ? 'bg-pencil text-paper border-pencil shadow-hard'
            : 'bg-white text-pencil border-pencil shadow-hard hover:bg-pencil hover:text-paper',
          className,
        ].join(' ')}
      >
        <Bookmark size={16} strokeWidth={2.5} fill={saved ? 'currentColor' : 'none'} />
        {label}
      </button>
    );
  }

  // icon variant
  return (
    <button
      onClick={handle}
      aria-label={saved ? 'Remove from reading list' : 'Save to reading list'}
      aria-pressed={saved}
      title={label}
      className={[
        'flex items-center justify-center w-8 h-8 border-2 border-pencil bg-white transition-all duration-100',
        'hover:bg-pencil hover:text-paper',
        saved ? 'text-accent' : 'text-pencil/70',
        className,
      ].join(' ')}
      style={{ borderRadius: '60% 40% 55% 45% / 45% 55% 45% 55%' }}
    >
      <Bookmark size={15} strokeWidth={2.5} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
};
