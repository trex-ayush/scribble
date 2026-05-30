import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/tokens.js';

const _buildTokenPayload = (user) => ({ id: user._id, email: user.email });

export const authService = {
  async register({ username, email, password, name }) {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Username';
      throw ApiError.conflict(`${field} already in use`);
    }
    const user = await User.create({ username, email, password, name });
    const tokens = generateTokenPair(_buildTokenPayload(user));
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });
    return { user: user.toPublicJSON(), tokens };
  },

  async login({ identifier, email, password }) {
    // Accept either an email or a username via a single `identifier` field;
    // `email` is still honored for backward compatibility.
    const value = (identifier || email || '').trim().toLowerCase();
    if (!value) throw ApiError.badRequest('Email or username is required');

    const user = await User.findOne({
      $or: [{ email: value }, { username: value }],
    }).select('+password +refreshToken');

    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    const tokens = generateTokenPair(_buildTokenPayload(user));
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });
    return { user: user.toPublicJSON(), tokens };
  },

  async refresh(incomingRefreshToken) {
    if (!incomingRefreshToken) throw ApiError.unauthorized('Refresh token required');
    let decoded;
    try { decoded = verifyRefreshToken(incomingRefreshToken); }
    catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw ApiError.unauthorized('Refresh token reuse detected');
    }
    const tokens = generateTokenPair(_buildTokenPayload(user));
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });
    return tokens;
  },

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  },
};
