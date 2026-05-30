import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { WritePost } from './pages/WritePost.jsx';
import { Drafts } from './pages/Drafts.jsx';
import { PostDetail } from './pages/PostDetail.jsx';
import { Profile } from './pages/Profile.jsx';
import { Settings } from './pages/Settings.jsx';
import { ActivityLog } from './pages/ActivityLog.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { useAuth } from './hooks/useAuth.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const { fetchMe } = useAuth();

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route
          path="/write"
          element={<ProtectedRoute><WritePost /></ProtectedRoute>}
        />
        <Route
          path="/write/:id"
          element={<ProtectedRoute><WritePost /></ProtectedRoute>}
        />
        <Route
          path="/drafts"
          element={<ProtectedRoute><Drafts /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><Settings /></ProtectedRoute>}
        />
        <Route
          path="/activity"
          element={<ProtectedRoute><ActivityLog /></ProtectedRoute>}
        />
        {/* Profile last among single-segment routes; "@" stripped in Profile. */}
        <Route path="/:username" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
