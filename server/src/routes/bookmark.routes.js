import { Router } from 'express';
import { bookmarkController } from '../controllers/bookmark.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Bookmarks belong to the logged-in user only (personal reading list) — no
// workspace context, just authentication.
const router = Router();
router.use(authenticate);

router.get('/', bookmarkController.list);
router.get('/ids', bookmarkController.listIds);
router.post('/:postId', bookmarkController.toggle);

export default router;
