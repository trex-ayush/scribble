import { Router } from 'express';
import { commentController } from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { commentValidator } from '../validators/comment.validator.js';

const router = Router();

router.get('/:slug/comments', commentController.getComments);
router.post('/:slug/comments', authenticate, validate(commentValidator), commentController.addComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);

export default router;
