import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * HTTP Basic Auth for the public API.
 * Expects: Authorization: Basic base64(apiKey:apiSecret)
 *
 * If NO Basic Auth header → skip to next router (lets JWT web routes handle it).
 * If Basic Auth header present but invalid → 401.
 */
export const basicAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';

    // No Basic Auth header — pass to next router (JWT web app routes).
    if (!header.startsWith('Basic ')) {
      return next('router');
    }

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const apiKey = idx === -1 ? decoded : decoded.slice(0, idx);
    const apiSecret = idx === -1 ? '' : decoded.slice(idx + 1);

    const user = await User.findOne({ apiKey, apiEnabled: true }).select('+apiSecret');
    if (!user || !apiSecret || !(await user.compareApiSecret(apiSecret))) {
      throw ApiError.unauthorized('Invalid API credentials');
    }

    req.user = { id: user._id, email: user.email, username: user.username, name: user.name };
    req.apiOrigin = 'API'; // picked up by activityLogger
    next();
  } catch (err) {
    next(err.isOperational ? err : ApiError.unauthorized());
  }
};
