import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { WorkspaceBanner } from './WorkspaceBanner.jsx';

export const Layout = () => (
  <div className="min-h-screen flex flex-col bg-paper">
    <WorkspaceBanner />
    <Navbar />
    <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10">
      <Outlet />
    </main>
    <Footer />
  </div>
);
