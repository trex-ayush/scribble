import { Router } from 'express';
import { postController } from '../controllers/post.controller.js';
import { basicAuth } from '../middleware/basicAuth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPostValidator, updatePostValidator } from '../validators/post.validator.js';

/**
 * Public REST API — Basic Auth (apiKey:apiSecret).
 * Mounted at /api/v1 BEFORE the JWT web router.
 * Only write routes are here; reads are handled by the web router.
 * basicAuth calls next('router') when no Basic Auth header is present,
 * so JWT web-app requests fall through cleanly.
 */
const router = Router();

router.post('/posts', basicAuth, validate(createPostValidator), postController.createPost);
router.put('/posts/:id', basicAuth, validate(updatePostValidator), postController.updatePost);
router.delete('/posts/:id', basicAuth, postController.deletePost);
router.post('/posts/:id/clap', basicAuth, postController.toggleClap);

export default router;
