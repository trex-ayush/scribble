import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Footer } from './Footer.jsx';
import { WorkspaceBanner } from './WorkspaceBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const RouteFallback = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const Layout = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <WorkspaceBanner />
      <Navbar />
      <div className="flex-1 w-full flex">
        {isAuthenticated && <Sidebar />}
        <main
          className={
            isAuthenticated
              ? 'flex-1 min-w-0 pt-4 pb-24 md:pb-10 px-4 sm:px-6 md:px-8'
              : 'flex-1 min-w-0 max-w-7xl mx-auto py-10 px-4 sm:px-6'
          }
        >
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
};
