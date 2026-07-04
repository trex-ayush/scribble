import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Session } from '../models/session.model.js';
import { ApiError } from '../utils/ApiError.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/tokens.js';
import { parseDevice, sha256 } from '../utils/device.js';

const slugifyBase = (str) =>
  String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);

// Unique username from the name (or email), with a random suffix on collision.
const generateUniqueUsername = async (name, email) => {
  let base = slugifyBase(name) || slugifyBase((email || '').split('@')[0]) || 'writer';
  if (base.length < 3) base = `${base}writer`.slice(0, 20);
  let candidate = base;
  for (let i = 0; i < 6; i++) {
    if (!(await User.exists({ username: candidate }))) return candidate;
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    candidate = `${base.slice(0, 30 - suffix.length)}${suffix}`;
  }
  return `${base.slice(0, 22)}${Date.now().toString(36)}`.slice(0, 30);
};

// Issue a token pair bound to a fresh Session (records device/ip + the refresh
// token hash for rotation/reuse detection). Returns the tokens.
const createSession = async (user, meta = {}) => {
  const sid = new mongoose.Types.ObjectId();
  const tokens = generateTokenPair({ id: user._id, email: user.email, sid: String(sid) });
  const { exp } = verifyRefreshToken(tokens.refreshToken); // align TTL with the JWT's own expiry
  await Session.create({
    _id: sid,
    user: user._id,
    tokenHash: sha256(tokens.refreshToken),
    userAgent: meta.userAgent || '',
    device: parseDevice(meta.userAgent || ''),
    ip: meta.ip || '',
    lastActiveAt: new Date(),
    expiresAt: new Date(exp * 1000),
  });
  return tokens;
};

export const authService = {
  async register({ username, email, password, name }, meta = {}) {
    if (await User.findOne({ email })) throw ApiError.conflict('Email already in use');

    let finalUsername;
    if (username) {
      if (await User.findOne({ username })) throw ApiError.conflict('Username already in use');
      finalUsername = username;
    } else {
      finalUsername = await generateUniqueUsername(name, email);
    }

    let user;
    try {
      user = await User.create({ username: finalUsername, email, password, name });
    } catch (e) {
      // Lost a race on the generated username — retry once.
      if (e.code === 11000 && !username) {
        user = await User.create({
          username: await generateUniqueUsername(name, email),
          email,
          password,
          name,
        });
      } else throw e;
    }
    const tokens = await createSession(user, meta);
    return { user: user.toPublicJSON(), tokens };
  },

  async login({ identifier, email, password }, meta = {}) {
    // Accept either an email or a username via a single `identifier` field;
    // `email` is still honored for backward compatibility.
    const value = (identifier || email || '').trim().toLowerCase();
    if (!value) throw ApiError.badRequest('Email or username is required');

    const user = await User.findOne({
      $or: [{ email: value }, { username: value }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    const tokens = await createSession(user, meta);
    return { user: user.toPublicJSON(), tokens };
  },

  async refresh(incomingRefreshToken, meta = {}) {
    if (!incomingRefreshToken) throw ApiError.unauthorized('Refresh token required');
    let decoded;
    try {
      decoded = verifyRefreshToken(incomingRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
    // Tokens minted before sessions existed have no sid → force a re-login.
    if (!decoded.sid) throw ApiError.unauthorized('Session ended. Please log in again.');

    const session = await Session.findOne({ _id: decoded.sid, user: decoded.id });
    if (!session) throw ApiError.unauthorized('Session ended. Please log in again.');

    if (session.tokenHash !== sha256(incomingRefreshToken)) {
      // An old/rotated token was replayed — revoke the whole session.
      await Session.deleteOne({ _id: session._id });
      throw ApiError.unauthorized('Refresh token reuse detected');
    }

    const tokens = generateTokenPair({ id: decoded.id, email: decoded.email, sid: String(session._id) });
    const { exp } = verifyRefreshToken(tokens.refreshToken);
    session.tokenHash = sha256(tokens.refreshToken);
    session.lastActiveAt = new Date();
    session.expiresAt = new Date(exp * 1000);
    if (meta.ip) session.ip = meta.ip;
    await session.save();
    return tokens;
  },

  async logout(sid) {
    if (sid) await Session.deleteOne({ _id: sid });
  },

  async listSessions(userId, currentSid) {
    const sessions = await Session.find({ user: userId }).sort({ lastActiveAt: -1 }).lean();
    return sessions.map((s) => ({
      id: String(s._id),
      device: s.device,
      ip: s.ip,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      current: String(s._id) === String(currentSid),
    }));
  },

  async revokeSession(userId, sid) {
    if (!mongoose.isValidObjectId(sid)) throw ApiError.notFound('Session not found');
    const res = await Session.deleteOne({ _id: sid, user: userId });
    if (res.deletedCount === 0) throw ApiError.notFound('Session not found');
  },

  async revokeOthers(userId, currentSid) {
    await Session.deleteMany({ user: userId, _id: { $ne: currentSid } });
  },
};
