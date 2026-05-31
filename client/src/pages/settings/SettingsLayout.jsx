import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, KeyRound, BookOpen, Activity, Users } from 'lucide-react';
import { workspaceStore } from '../../store/workspaceStore.js';

const NAV = [
  { to: '/settings', end: true, icon: User, label: 'Profile' },
  // Team Members & API Settings belong to the owner — hidden while impersonating.
  { to: '/settings/team', icon: Users, label: 'Team Members', ownerOnly: true },
  { to: '/settings/api', icon: KeyRound, label: 'API Settings', ownerOnly: true },
  { to: '/settings/api-docs', icon: BookOpen, label: 'API Docs' },
  { to: '/settings/activity', icon: Activity, label: 'Activity Log' },
];

export const SettingsLayout = () => {
  const active = workspaceStore((s) => s.active);
  const nav = NAV.filter((item) => !(item.ownerOnly && active));

  return (
  <div className="space-y-6">
    <h1 className="font-heading text-3xl text-pencil">Settings</h1>

    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      {/* Sidebar nav */}
      <nav
        className="h-fit bg-white border-2 border-pencil shadow-hard p-2 space-y-1"
        style={{ borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px' }}
      >
        {nav.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 px-4 py-2.5 font-body text-sm transition-colors duration-100 rounded',
                isActive ? 'bg-pencil text-paper' : 'text-pencil hover:bg-muted',
              ].join(' ')
            }
          >
            <Icon size={16} strokeWidth={2.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Section content */}
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  </div>
  );
};
