import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, MessageCircle, Hand, Users, CheckCheck } from 'lucide-react';
import { notificationStore } from '../../store/notificationStore.js';

// How each notification type renders: icon, sentence, and where it links.
const TYPE_META = {
  follow: {
    icon: UserPlus,
    text: () => 'started following you',
    href: (n) => (n.actor?.username ? `/@${n.actor.username}` : null),
  },
  clap: {
    icon: Hand,
    text: (n) => `clapped for your story${n.post?.title ? ` “${n.post.title}”` : ''}`,
    href: (n) => (n.post?.slug ? `/post/${n.post.slug}` : null),
  },
  comment: {
    icon: MessageCircle,
    text: (n) => `commented on your story${n.post?.title ? ` “${n.post.title}”` : ''}`,
    href: (n) => (n.post?.slug ? `/post/${n.post.slug}` : null),
  },
  team_add: {
    icon: Users,
    text: () => 'added you to their workspace',
    href: (n) => (n.actor?.username ? `/@${n.actor.username}` : null),
  },
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { items, unread, loading, fetchUnreadCount, fetchList, markRead, markAllRead } =
    notificationStore();

  // Event-driven (no polling): fetch the unread count on mount and whenever the
  // tab regains focus. Opening the dropdown also refreshes it via fetchList.
  useEffect(() => {
    fetchUnreadCount();
    const onFocus = () => fetchUnreadCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchUnreadCount]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchList();
  };

  const handleClick = (n) => {
    if (!n.read) markRead(n._id);
    const href = TYPE_META[n.type]?.href(n);
    setOpen(false);
    if (href) navigate(href);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative flex items-center px-3 py-2 font-body text-pencil hover:bg-muted rounded transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell size={18} strokeWidth={2.5} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-body bg-accent text-white border-2 border-pencil rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-80 max-w-[90vw] bg-white border-2 border-pencil shadow-hard overflow-hidden z-30"
          style={{ borderRadius: '12px 5px 12px 5px / 5px 12px 5px 12px' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-pencil">
            <span className="font-heading text-base text-pencil">Notifications</span>
            {items.some((n) => !n.read) && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 font-body text-xs text-pencil/70 hover:text-ink transition-colors"
              >
                <CheckCheck size={13} strokeWidth={2.5} />
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <li className="px-4 py-6 text-center font-body text-sm text-pencil/50">Loading…</li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-4 py-8 text-center font-body text-sm text-pencil/50">
                No notifications yet
              </li>
            )}
            {items.map((n) => {
              const meta = TYPE_META[n.type];
              if (!meta) return null;
              const Icon = meta.icon;
              const who = n.actor?.name || n.actor?.username || 'Someone';
              return (
                <li key={n._id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={[
                      'flex items-start gap-3 w-full text-left px-4 py-3 border-b border-dashed border-pencil/20 transition-colors',
                      n.read ? 'hover:bg-muted/50' : 'bg-accent/5 hover:bg-accent/10',
                    ].join(' ')}
                  >
                    <span className="mt-0.5 shrink-0 text-pencil/70">
                      <Icon size={16} strokeWidth={2.5} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-body text-sm text-pencil leading-snug block">
                        <strong className="font-heading">{who}</strong> {meta.text(n)}
                      </span>
                      <span className="font-body text-xs text-pencil/50">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-accent" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
