import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PenLine, FileText, Bookmark, BarChart3, Settings } from 'lucide-react';
import { postsApi } from '../../api/posts.js';

// Primary navigation, moved out of the top bar. Desktop (md+) = left rail;
// mobile = fixed bottom tab bar (so the rail never crushes content on phones).
const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/write', label: 'Write', icon: PenLine },
  { to: '/drafts', label: 'Drafts', icon: FileText, badge: true },
  { to: '/bookmarks', label: 'Saved', icon: Bookmark },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const railClass = ({ isActive }) =>
  [
    'relative flex flex-col items-center justify-center gap-1 w-full py-3 px-1 font-body text-[11px] border-2 transition-all duration-100',
    isActive
      ? 'bg-accent text-paper border-pencil shadow-hard-sm'
      : 'bg-transparent text-pencil/70 border-transparent hover:bg-muted hover:text-pencil',
  ].join(' ');

const tabClass = ({ isActive }) =>
  [
    'relative flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-2 font-body text-[10px] leading-tight transition-colors duration-100',
    isActive ? 'text-accent' : 'text-pencil/60',
  ].join(' ');

// Dark pill so the count contrasts on BOTH the inactive (paper) and active
// (accent red) backgrounds; on-palette paper text.
const Badge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] bg-pencil text-paper border-2 border-paper rounded-full">
      {count}
    </span>
  ) : null;

export const Sidebar = () => {
  // Re-fetch the draft count on every navigation so the badge never goes stale
  // (publishing/deleting/saving a draft changes the count).
  const { pathname } = useLocation();
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    postsApi
      .getMyDrafts()
      .then(({ data }) => setDraftCount(data.data.posts.length))
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      {/* Desktop: left rail */}
      <aside className="hidden md:block shrink-0 w-24 border-r-2 border-dashed border-pencil/30">
        <nav className="sticky top-[75px] flex flex-col gap-2 pt-4 pb-6 px-3">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={railClass}
              style={{ borderRadius: '14px 6px 14px 6px / 6px 14px 6px 14px' }}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={2.5} />
                {badge && <Badge count={draftCount} />}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile: fixed bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-paper border-t-[3px] border-pencil pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={tabClass}>
            <span className="relative">
              <Icon size={20} strokeWidth={2.5} />
              {badge && <Badge count={draftCount} />}
            </span>
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};
