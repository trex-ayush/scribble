import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { env } from '../config/env.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';

// Strict per-IP throttle on credential endpoints to blunt brute-force /
// credential-stuffing. Tighter than the global limiter. Skipped in dev.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' },
  skip: () => env.isDev,
});

const router = Router();

router.post('/register', authLimiter, validate(registerValidator), authController.register);
router.post('/login', authLimiter, validate(loginValidator), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

// Device/session management. `/others` before `/:id` so it isn't read as an id.
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/others', authenticate, authController.revokeOtherSessions);
router.delete('/sessions/:id', authenticate, authController.revokeSession);

export default router;
