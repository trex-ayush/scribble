import { ActivityLog } from '../models/activityLog.model.js';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const ACTION_BY_METHOD = { POST: 'Created', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Deleted' };

// Map a request path to a human-readable event source.
const deriveSource = (path) => {
  if (path.startsWith('/auth/login')) return 'User Login';
  if (path.startsWith('/auth/logout')) return 'User Logout';
  if (path.startsWith('/auth/register')) return 'User';
  if (path.startsWith('/auth/refresh')) return null; // noise, skip
  if (path.startsWith('/team/access')) return null; // logged explicitly as "Team Member Login"
  if (path.startsWith('/notifications')) return null; // reading your own inbox isn't an audit event
  if (path.startsWith('/bookmarks')) return null; // personal reading list, not an audit event
  if (path.startsWith('/api-keys')) return 'API Key';
  if (path.includes('/comments')) return 'Comment';
  if (path.includes('/clap')) return 'Clap';
  if (path.includes('/follow')) return 'Follow';
  if (path.startsWith('/users')) return 'Profile';
  if (path.startsWith('/posts')) return 'Post';
  return 'System';
};

// Never persist these in the activity payload.
const SENSITIVE = ['password', 'refreshToken', '__v', 'claps', 'content', 'apiSecret', 'apiSecretPlain'];
const stripSensitive = (obj) => {
  const clean = { ...obj };
  SENSITIVE.forEach((k) => delete clean[k]);
  return clean;
};

/**
 * Centralized activity logger — the ONLY place activity is recorded.
 * Any successful non-GET request (web app + public API) is logged
 * automatically after the response is sent, so controllers stay clean.
 */
export const activityLogger = (req, res, next) => {
  if (!WRITE_METHODS.includes(req.method)) return next();

  const originalJson = res.json.bind(res);
  let payload;
  res.json = (body) => {
    payload = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    if (res.statusCode >= 400) return; // only successful writes

    const fullPath = req.originalUrl.split('?')[0];
    const origin = req.apiOrigin === 'API' ? 'API' : 'USER';
    const path = fullPath.replace(/^\/api\/v\d+/, '');
    const source = deriveSource(path);
    if (!source) return;

    const data = payload?.data || {};
    const resource = data.post || data.comment || data.user || data || {};
    const actorId = req.user?.id || data.user?._id;
    if (!actorId) return; // skip unauthenticated noise

    // The account the action belongs to. When a team member acts inside an
    // owner's workspace, the action is recorded under the owner so the owner
    // sees it in their activity log.
    //
    // SECURITY: use the workspace owner resolved by resolveWorkspace (which
    // verifies accepted membership) — NEVER the raw X-Workspace-Id header.
    // Trusting the header here let any user inject forged entries into an
    // arbitrary victim's activity log via routes without workspace resolution
    // (e.g. /auth/login). req.workspaceOwner is absent on those routes, so the
    // entry correctly falls back to the actor's own account.
    const wsOwner = req.workspaceOwner;
    const accountId = wsOwner && String(wsOwner) !== String(actorId) ? wsOwner : actorId;
    const viaTeam = String(accountId) !== String(actorId);

    // Best identifier for the affected resource.
    const eventData =
      resource._id ||
      resource.apiKey ||      // API Key operations
      req.params.id ||
      req.params.slug ||
      req.params.username ||
      String(actorId);        // settings-style actions act on the user

    const snapshot = stripSensitive(resource);
    const requestBody = stripSensitive(req.body || {});

    // DELETE returns 204 (no body) → build snapshot from the request instead.
    let resolvedPayload;
    if (req.method === 'DELETE') {
      resolvedPayload = {
        id: String(eventData),
        source,
        ...(req.params.slug && { slug: req.params.slug }),
        ...(req.params.username && { username: req.params.username }),
        deletedAt: new Date().toISOString(),
      };
    } else if (Object.keys(snapshot).length) {
      resolvedPayload = snapshot;
    } else {
      resolvedPayload = requestBody;
    }

    ActivityLog.create({
      actor: actorId,
      actorEmail: req.user?.email || data.user?.email,
      // Always prefer the actor's real name so the same account never shows
      // "Ayush Kumar Singh" on one row and "ayush" (username) on another.
      actorName:
        req.user?.name || data.user?.name || req.user?.username || data.user?.username,
      account: accountId,
      viaTeam,
      source,
      origin,
      action: ACTION_BY_METHOD[req.method],
      method: req.method,
      path: req.originalUrl,
      eventData: String(eventData),
      payload: resolvedPayload,
    }).catch((e) => console.error('[ActivityLog]', e.message));
  });

  next();
};
