import { Router } from 'express';
import { postController } from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { resolveWorkspace, enforceReadOnly } from '../middleware/workspace.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPostValidator, updatePostValidator } from '../validators/post.validator.js';

const router = Router();

// Reads
router.get('/', postController.getFeed);
router.get('/drafts', authenticate, resolveWorkspace, postController.getMyDrafts);
router.get('/tags', postController.getTags);
router.get('/:id/edit', authenticate, resolveWorkspace, postController.getOwnPost);
router.get('/:slug', optionalAuth, postController.getPost);

// Writes — workspace-scoped + read-only enforced.
router.post('/', authenticate, resolveWorkspace, enforceReadOnly, validate(createPostValidator), postController.createPost);
router.put('/:id', authenticate, resolveWorkspace, enforceReadOnly, validate(updatePostValidator), postController.updatePost);
router.delete('/:id', authenticate, resolveWorkspace, enforceReadOnly, postController.deletePost);
router.post('/:id/clap', authenticate, resolveWorkspace, enforceReadOnly, postController.toggleClap);

export default router;
