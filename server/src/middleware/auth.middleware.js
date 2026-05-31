import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';

const _extractToken = (req) =>
  req.cookies?.accessToken ||
  req.headers.authorization?.replace(/^Bearer\s+/, '');

export const authenticate = async (req, res, next) => {
  try {
    const token = _extractToken(req);
    if (!token) throw ApiError.unauthorized();
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).lean();
    if (!user) throw ApiError.unauthorized();
    req.user = { id: user._id, email: user.email, username: user.username, name: user.name };
    next();
  } catch (err) {
    next(err.isOperational ? err : ApiError.unauthorized());
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = _extractToken(req);
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).lean();
      if (user) req.user = { id: user._id, email: user.email, username: user.username, name: user.name };
    }
  } catch { /* continue as unauthenticated */ }
  next();
};
