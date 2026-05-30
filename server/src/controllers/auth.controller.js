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
  res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    _setCookies(res, result.tokens);
    ApiResponse.created(res, result, 'Registration successful');
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    _setCookies(res, result.tokens);
    ApiResponse.success(res, result, 'Login successful');
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await authService.refresh(token);
    _setCookies(res, tokens);
    ApiResponse.success(res, tokens, 'Tokens refreshed');
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    ApiResponse.success(res, null, 'Logged out');
  }),

  me: asyncHandler(async (req, res) => {
    ApiResponse.success(res, { user: req.user });
  }),
};
