import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PenLine, User, LogOut, FileText, Search, ChevronDown, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/Button.jsx';
import { workspaceStore } from '../../store/workspaceStore.js';
import { notificationStore } from '../../store/notificationStore.js';
import { bookmarkStore } from '../../store/bookmarkStore.js';
import { NotificationBell } from './NotificationBell.jsx';

const SEARCH_TYPES = [
  { key: 'stories', label: 'Stories', icon: FileText },
  { key: 'users', label: 'Users', icon: Users },
];

const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') === 'users' ? 'users' : 'stories');
  const [open, setOpen] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
    setType(searchParams.get('type') === 'users' ? 'users' : 'stories');
  }, [searchParams]);

  useEffect(() => {
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return navigate('/');
    const suffix = type === 'users' ? '&type=users' : '';
    navigate(`/?search=${encodeURIComponent(q)}${suffix}`);
  };

  const current = SEARCH_TYPES.find((t) => t.key === type);
  const CurrentIcon = current.icon;

  return (
    <form onSubmit={handleSubmit} className={`flex items-stretch ${className}`}>
      <div ref={ddRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 h-full px-3 py-2 bg-muted border-2 border-r-0 border-pencil
                     font-body text-sm text-pencil hover:bg-muted/70 transition-colors"
          style={{ borderRadius: '12px 0 0 12px' }}
        >
          <CurrentIcon size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown size={14} strokeWidth={2.5} />
        </button>
        {open && (
          <ul
            className="absolute z-30 top-full left-0 mt-1 w-40 bg-white border-2 border-pencil shadow-hard overflow-hidden"
            style={{ borderRadius: '12px 5px 12px 5px / 5px 12px 5px 12px' }}
          >
            {SEARCH_TYPES.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => { setType(key); setOpen(false); }}
                  className={[
                    'flex items-center gap-2 w-full text-left px-3 py-2 font-body text-sm transition-colors',
                    type === key ? 'bg-muted' : 'hover:bg-muted/60',
                  ].join(' ')}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative flex-1 min-w-0">
        <Search
          size={16}
          strokeWidth={2.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/40 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={type === 'users' ? 'Search people...' : 'Search stories...'}
          aria-label="Search"
          className="w-full font-body text-sm pl-9 pr-3 py-2 bg-white border-2 border-pencil
                     placeholder:text-pencil/40 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20
                     transition-all duration-100"
          style={{ borderRadius: '0 12px 12px 0' }}
        />
      </div>
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

        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="sm">Sign in</Button>
              </Link>
              <Link to="/register" className="hidden sm:block">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
