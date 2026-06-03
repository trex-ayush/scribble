import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: !env.isDev,
  sameSite: env.isDev ? 'lax' : 'strict',
};

const _setCookies = (res, { accessToken, refreshToken }) => {
  // Cookie lifetimes track the JWT lifetimes (15m access / 30d refresh).
  res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

const _clearCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
};

// Device/IP captured per request so each session shows where it signed in.
const _meta = (req) => ({ userAgent: req.headers['user-agent'] || '', ip: req.ip });

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, _meta(req));
    _setCookies(res, result.tokens);
    // Tokens travel ONLY in httpOnly cookies — never in the JSON body.
    ApiResponse.created(res, { user: result.user }, 'Registration successful');
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, _meta(req));
    _setCookies(res, result.tokens);
    ApiResponse.success(res, { user: result.user }, 'Login successful');
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await authService.refresh(token, _meta(req));
    _setCookies(res, tokens);
    ApiResponse.success(res, null, 'Tokens refreshed');
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user.sid);
    _clearCookies(res);
    ApiResponse.success(res, null, 'Logged out');
  }),

  me: asyncHandler(async (req, res) => {
    ApiResponse.success(res, { user: req.user });
  }),

  getSessions: asyncHandler(async (req, res) => {
    const sessions = await authService.listSessions(req.user.id, req.user.sid);
    ApiResponse.success(res, { sessions });
  }),

  revokeSession: asyncHandler(async (req, res) => {
    await authService.revokeSession(req.user.id, req.params.id);
    // Revoking your own current session = logging out this device.
    if (String(req.params.id) === String(req.user.sid)) _clearCookies(res);
    ApiResponse.success(res, null, 'Device logged out');
  }),

  revokeOtherSessions: asyncHandler(async (req, res) => {
    await authService.revokeOthers(req.user.id, req.user.sid);
    ApiResponse.success(res, null, 'Logged out of all other devices');
  }),
};
