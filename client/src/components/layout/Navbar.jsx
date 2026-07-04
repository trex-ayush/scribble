import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { PenLine, User, LogOut, FileText, Search, ChevronDown, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/Button.jsx';
import { withNext } from '../../lib/authRedirect.js';
import { workspaceStore } from '../../store/workspaceStore.js';
import { notificationStore } from '../../store/notificationStore.js';
import { bookmarkStore } from '../../store/bookmarkStore.js';
import { NotificationBell } from './NotificationBell.jsx';
import { searchApi } from '../../api/search.js';

const EMPTY = { posts: [], users: [] };
const rowCls = (active) =>
  [
    'w-full flex items-start gap-2 px-3 py-2 text-left transition-colors',
    active ? 'bg-muted' : 'hover:bg-muted',
  ].join(' ');
const groupCls =
  'flex items-center gap-1 px-3 pt-2 pb-1 font-body text-[11px] uppercase tracking-wide text-pencil/40';

// Unified search: one box for stories AND people, with a live type-ahead
// dropdown (no Stories/Users toggle). Enter — or the footer — opens the full
// blended results page.
const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);

  // Keep the box in sync when the URL search param changes (e.g. navigation).
  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Debounced type-ahead. Aborts the in-flight request on each keystroke so a
  // slow response can't overwrite newer results.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await searchApi.suggest(q, controller.signal);
        setResults({ posts: data.data.posts, users: data.data.users });
        setActiveIndex(-1);
        setOpen(true);
      } catch {
        /* aborted or failed — ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.trim();
  const { posts, users } = results;
  const hasResults = posts.length > 0 || users.length > 0;
  // Flat, ordered list of navigable targets for keyboard nav: stories, then
  // people, then the "see all" footer.
  const targets = [
    ...posts.map((p) => `/post/${p.slug}`),
    ...users.map((u) => `/@${u.username}`),
    ...(q ? [`/?search=${encodeURIComponent(q)}`] : []),
  ];
  const seeAllIndex = targets.length - 1;
  const showDropdown = open && q.length >= 2;

  const go = (to) => {
    setOpen(false);
    setActiveIndex(-1);
    navigate(to);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && targets[activeIndex]) return go(targets[activeIndex]);
    if (q) return go(`/?search=${encodeURIComponent(q)}`);
    go('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && hasResults) return setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, targets.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} ref={boxRef}>
      <Search
        size={16}
        strokeWidth={2.5}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/40 pointer-events-none z-10"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => q.length >= 2 && hasResults && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search stories & people..."
        aria-label="Search"
        autoComplete="off"
        className="w-full font-body text-sm pl-9 pr-3 py-2 bg-white border-2 border-pencil
                   placeholder:text-pencil/40 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20
                   transition-all duration-100"
        style={{ borderRadius: '12px 5px 12px 5px / 5px 12px 5px 12px' }}
      />

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border-2 border-pencil shadow-hard
                     max-h-[70vh] overflow-y-auto overflow-x-hidden"
          style={{ borderRadius: '12px 5px 12px 5px / 5px 12px 5px 12px' }}
        >
          {loading && !hasResults && (
            <p className="px-4 py-3 font-body text-sm text-pencil/50">Searching…</p>
          )}

          {posts.length > 0 && (
            <>
              <p className={groupCls}>
                <FileText size={11} strokeWidth={2.5} /> Stories
              </p>
              {posts.map((p, i) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => go(`/post/${p.slug}`)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={rowCls(activeIndex === i)}
                >
                  <FileText size={14} strokeWidth={2.5} className="shrink-0 mt-0.5 text-pencil/50" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-sm text-pencil">{p.title}</span>
                    <span className="block truncate font-body text-xs text-pencil/50">
                      {p.author?.name || p.author?.username} · {p.readingTime} min read
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          {users.length > 0 && (
            <>
              <p className={groupCls}>
                <Users size={11} strokeWidth={2.5} /> People
              </p>
              {users.map((u, i) => {
                const flat = posts.length + i;
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => go(`/@${u.username}`)}
                    onMouseEnter={() => setActiveIndex(flat)}
                    className={rowCls(activeIndex === flat)}
                  >
                    <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 bg-muted border border-pencil rounded-full">
                      <User size={11} strokeWidth={2.5} className="text-pencil" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-sm text-pencil">
                        {u.name || u.username}
                      </span>
                      <span className="block truncate font-body text-xs text-pencil/50">
                        @{u.username}
                      </span>
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {!loading && !hasResults && (
            <p className="px-4 py-3 font-body text-sm text-pencil/50">No quick matches.</p>
          )}

          {q && (
            <button
              type="button"
              onClick={() => go(`/?search=${encodeURIComponent(q)}`)}
              onMouseEnter={() => setActiveIndex(seeAllIndex)}
              className={[
                'w-full flex items-center gap-2 px-4 py-2.5 border-t-2 border-dashed border-pencil/30 font-body text-sm text-ink text-left transition-colors',
                activeIndex === seeAllIndex ? 'bg-muted' : 'hover:bg-muted',
              ].join(' ')}
            >
              <Search size={14} strokeWidth={2.5} className="shrink-0" />
              <span className="truncate">See all results for “{q}”</span>
            </button>
          )}
        </div>
      )}
    </form>
  );
};

const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = workspaceStore((s) => s.active);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // While impersonating, the navbar reflects the OWNER you're acting as.
  const displayName = active ? active.name : (user.name || user.username);
  const displayHandle = active ? active.username : user.username;

  const exitAccess = () => {
    workspaceStore.getState().switchTo(null);
    window.location.href = '/';
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 font-body text-pencil hover:bg-muted rounded transition-colors"
      >
        <User size={18} strokeWidth={2.5} />
        <span className="hidden md:inline max-w-[120px] truncate">{displayName}</span>
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

      {open && (
        <ul
          className="absolute right-0 top-full mt-1 w-52 bg-white border-2 border-pencil shadow-hard overflow-hidden z-30"
          style={{ borderRadius: '12px 5px 12px 5px / 5px 12px 5px 12px' }}
        >
          <li>
            <Link
              to={`/@${displayHandle}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 font-body text-sm text-pencil hover:bg-muted transition-colors"
            >
              <User size={15} strokeWidth={2.5} />
              Profile
            </Link>
          </li>

          <li className="border-t-2 border-dashed border-pencil/30">
            {active ? (
              <button
                onClick={() => { setOpen(false); exitAccess(); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 font-body text-sm text-pencil hover:bg-muted transition-colors"
              >
                <LogOut size={15} strokeWidth={2.5} />
                Exit access
              </button>
            ) : (
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 font-body text-sm text-accent hover:bg-accent/10 transition-colors"
              >
                <LogOut size={15} strokeWidth={2.5} />
                Log out
              </button>
            )}
          </li>
        </ul>
      )}
    </div>
  );
};

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.pathname + location.search;

  const handleLogout = async () => {
    workspaceStore.getState().reset();
    notificationStore.getState().reset();
    bookmarkStore.getState().reset();
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-sm border-b-[3px] border-pencil">
      <nav className="w-full px-3 sm:px-6 h-[72px] flex items-center gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <PenLine
            size={28}
            strokeWidth={2.5}
            className="text-accent group-hover:rotate-12 transition-transform duration-100"
          />
          <span className="font-heading text-2xl text-pencil hidden sm:inline">Scribble</span>
        </Link>

        <SearchBar className="flex-1 max-w-md mx-auto" />

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link to={withNext('/login', from)}>
                <Button variant="secondary" size="sm">Sign in</Button>
              </Link>
              <Link to={withNext('/register', from)} className="hidden sm:block">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
