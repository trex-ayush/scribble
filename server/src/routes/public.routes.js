import { Router } from 'express';
import { postController } from '../controllers/post.controller.js';
import { basicAuth } from '../middleware/basicAuth.middleware.js';
import { activityLogger } from '../middleware/activityLog.middleware.js';
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

// One gate for the whole public API. basicAuth authenticates (and calls
// next('router') when there's no Basic Auth header, so JWT web requests fall
// through to the web router — logged there once). activityLogger then records
// each API write with origin: 'API'. Both run once instead of per route.
router.use(basicAuth, activityLogger);

router.post('/posts', validate(createPostValidator), postController.createPost);
router.put('/posts/:id', validate(updatePostValidator), postController.updatePost);
router.delete('/posts/:id', postController.deletePost);
router.post('/posts/:id/clap', postController.toggleClap);

export default router;
