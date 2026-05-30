import { Router } from 'express';
import { postController } from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPostValidator, updatePostValidator } from '../validators/post.validator.js';

const router = Router();

router.get('/', postController.getFeed);
router.get('/drafts', authenticate, postController.getMyDrafts);
router.get('/tags', postController.getTags);
router.get('/:id/edit', authenticate, postController.getOwnPost);
router.get('/:slug', optionalAuth, postController.getPost);
router.post('/', authenticate, validate(createPostValidator), postController.createPost);
router.put('/:id', authenticate, validate(updatePostValidator), postController.updatePost);
router.delete('/:id', authenticate, postController.deletePost);
router.post('/:id/clap', authenticate, postController.toggleClap);

export default router;
