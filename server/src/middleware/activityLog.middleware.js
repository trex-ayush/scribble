import { ActivityLog } from '../models/activityLog.model.js';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const ACTION_BY_METHOD = { POST: 'Created', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Deleted' };

// Map a request path to a human-readable event source.
const deriveSource = (path) => {
  if (path.startsWith('/auth/login')) return 'User Login';
  if (path.startsWith('/auth/logout')) return 'User Logout';
  if (path.startsWith('/auth/register')) return 'User';
  if (path.startsWith('/auth/refresh')) return null; // noise, skip
  if (path.includes('/comments')) return 'Comment';
  if (path.includes('/clap')) return 'Clap';
  if (path.includes('/follow')) return 'Follow';
  if (path.startsWith('/users')) return 'Profile';
  if (path.startsWith('/posts')) return 'Post';
  return 'System';
};

/**
 * Centralized activity logger — the ONLY place activity is recorded.
 * Any successful non-GET request is logged automatically after the response
 * is sent, so individual controllers stay clean (DRY).
 */
export const activityLogger = (req, res, next) => {
  if (!WRITE_METHODS.includes(req.method)) return next();

  // Capture the JSON response so we can pull out the affected resource id
  // and the actor for routes where auth isn't set (login/register).
  const originalJson = res.json.bind(res);
  let payload;
  res.json = (body) => {
    payload = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    if (res.statusCode >= 400) return; // only successful writes

    // By the time 'finish' fires, req.path is restored to the full path, so
    // derive from originalUrl with the API prefix stripped.
    const path = req.originalUrl.split('?')[0].replace(/^\/api\/v\d+/, '');
    const source = deriveSource(path);
    if (!source) return;

    const data = payload?.data || {};
    const resource = data.post || data.comment || data.user || data || {};
    const actorId = req.user?.id || data.user?._id;
    if (!actorId) return; // skip unauthenticated noise

    const eventData =
      resource._id ||
      req.params.id ||
      req.params.slug ||
      req.params.username ||
      '';

    // Snapshot of the affected resource, with noisy/sensitive fields removed.
    const snapshot = { ...resource };
    ['password', 'refreshToken', '__v', 'claps', 'content'].forEach((k) => delete snapshot[k]);
    // For requests with a body (settings/profile updates), prefer that.
    const requestBody = { ...(req.body || {}) };
    ['password', 'refreshToken'].forEach((k) => delete requestBody[k]);

    // DELETE returns 204 with no body, so build the snapshot from the request
    // (id + identifier) instead of leaving event data empty.
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
      actorName: data.user?.name || data.user?.username || req.user?.username,
      source,
      action: ACTION_BY_METHOD[req.method],
      method: req.method,
      path: req.originalUrl,
      eventData: String(eventData),
      payload: resolvedPayload,
    }).catch((e) => console.error('[ActivityLog]', e.message));
  });

  next();
};
