import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { postController } from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { resolveWorkspace, enforceReadOnly } from '../middleware/workspace.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPostValidator, updatePostValidator } from '../validators/post.validator.js';
import { env } from '../config/env.js';

// Throttle read-tracking: it's unauthenticated and state-changing, so cap how
// fast a single IP can inflate counters. Skipped in dev.
const readLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  // Skip only in local dev; staging/misconfigured prod stay protected (fail closed).
  skip: () => env.NODE_ENV === 'development',
});

const router = Router();

// Reads
router.get('/', postController.getFeed);
router.get('/drafts', authenticate, resolveWorkspace, postController.getMyDrafts);
router.get('/tags', postController.getTags);
router.get('/analytics', authenticate, resolveWorkspace, postController.getAnalytics);
router.get('/:id/edit', authenticate, resolveWorkspace, postController.getOwnPost);
router.get('/:slug', optionalAuth, postController.getPost);

// Read-tracking — counts anonymous readers too, so no workspace/read-only gate.
router.post('/:id/read', readLimiter, optionalAuth, postController.recordRead);

// Writes — workspace-scoped + read-only enforced.
router.post('/', authenticate, resolveWorkspace, enforceReadOnly, validate(createPostValidator), postController.createPost);
router.put('/:id', authenticate, resolveWorkspace, enforceReadOnly, validate(updatePostValidator), postController.updatePost);
router.delete('/:id', authenticate, resolveWorkspace, enforceReadOnly, postController.deletePost);
router.post('/:id/clap', authenticate, resolveWorkspace, enforceReadOnly, postController.toggleClap);

export default router;
