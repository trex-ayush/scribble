import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { WritePost } from './pages/WritePost.jsx';
import { Drafts } from './pages/Drafts.jsx';
import { Bookmarks } from './pages/Bookmarks.jsx';
import { Stats } from './pages/Stats.jsx';
import { PostDetail } from './pages/PostDetail.jsx';
import { Profile } from './pages/Profile.jsx';
import { SettingsLayout } from './pages/settings/SettingsLayout.jsx';
import { ProfileSettings } from './pages/settings/ProfileSettings.jsx';
import { ApiSettings } from './pages/settings/ApiSettings.jsx';
import { ApiDocs } from './pages/settings/ApiDocs.jsx';
import { TeamMembers } from './pages/settings/TeamMembers.jsx';
import { Sessions } from './pages/settings/Sessions.jsx';
import { ActivityLog } from './pages/ActivityLog.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { useAuth } from './hooks/useAuth.js';
import { workspaceStore } from './store/workspaceStore.js';
import { bookmarkStore } from './store/bookmarkStore.js';
import { withNext } from './lib/authRedirect.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to={withNext('/login', location.pathname + location.search)} replace />
  );
};

const App = () => {
  const { fetchMe } = useAuth();

  useEffect(() => {
    // Load the user, then their team workspaces + saved bookmarks.
    fetchMe()
      .then(() => {
        workspaceStore.getState().loadWorkspaces();
        bookmarkStore.getState().loadIds();
      })
      .catch(() => {});
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
          path="/bookmarks"
          element={<ProtectedRoute><Bookmarks /></ProtectedRoute>}
        />
        <Route
          path="/stats"
          element={<ProtectedRoute><Stats /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}
        >
          <Route index element={<ProfileSettings />} />
          <Route path="team" element={<TeamMembers />} />
          <Route path="api" element={<ApiSettings />} />
          <Route path="api-docs" element={<ApiDocs />} />
          <Route path="devices" element={<Sessions />} />
          <Route path="activity" element={<ActivityLog />} />
        </Route>
        {/* Back-compat: old /activity path redirects into settings. */}
        <Route path="/activity" element={<Navigate to="/settings/activity" replace />} />
        {/* Profile last among single-segment routes; "@" stripped in Profile. */}
        <Route path="/:username" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
