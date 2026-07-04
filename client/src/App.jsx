import React, { useEffect, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import { useAuth } from './hooks/useAuth.js';
import { workspaceStore } from './store/workspaceStore.js';
import { bookmarkStore } from './store/bookmarkStore.js';
import { withNext } from './lib/authRedirect.js';

const named = (factory, name) => lazy(() => factory().then((m) => ({ default: m[name] })));

const Home = named(() => import('./pages/Home.jsx'), 'Home');
const Login = named(() => import('./pages/Login.jsx'), 'Login');
const Register = named(() => import('./pages/Register.jsx'), 'Register');
const WritePost = named(() => import('./pages/WritePost.jsx'), 'WritePost');
const Drafts = named(() => import('./pages/Drafts.jsx'), 'Drafts');
const Bookmarks = named(() => import('./pages/Bookmarks.jsx'), 'Bookmarks');
const Stats = named(() => import('./pages/Stats.jsx'), 'Stats');
const PostDetail = named(() => import('./pages/PostDetail.jsx'), 'PostDetail');
const Profile = named(() => import('./pages/Profile.jsx'), 'Profile');
const SettingsLayout = named(() => import('./pages/settings/SettingsLayout.jsx'), 'SettingsLayout');
const ProfileSettings = named(() => import('./pages/settings/ProfileSettings.jsx'), 'ProfileSettings');
const ApiSettings = named(() => import('./pages/settings/ApiSettings.jsx'), 'ApiSettings');
const ApiDocs = named(() => import('./pages/settings/ApiDocs.jsx'), 'ApiDocs');
const WebhookSettings = named(() => import('./pages/settings/WebhookSettings.jsx'), 'WebhookSettings');
const WebhookFormPage = named(() => import('./pages/settings/WebhookSettings.jsx'), 'WebhookFormPage');
const TeamMembers = named(() => import('./pages/settings/TeamMembers.jsx'), 'TeamMembers');
const Sessions = named(() => import('./pages/settings/Sessions.jsx'), 'Sessions');
const ActivityLog = named(() => import('./pages/ActivityLog.jsx'), 'ActivityLog');
const NotFound = named(() => import('./pages/NotFound.jsx'), 'NotFound');

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
          <Route path="webhooks" element={<WebhookSettings />} />
          <Route path="webhooks/new" element={<WebhookFormPage />} />
          <Route path="webhooks/:id/edit" element={<WebhookFormPage />} />
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
