import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { resolveWorkspace, enforceReadOnly } from '../middleware/workspace.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';

const profileValidator = [
  body('name').optional().trim().isLength({ max: 60 }),
  body('bio').optional().trim().isLength({ max: 300 }),
];

const router = Router();

// Specific routes must precede the dynamic ":username" route.
router.get('/search', userController.searchUsers);
router.put(
  '/me/profile',
  authenticate,
  resolveWorkspace,
  enforceReadOnly,
  validate(profileValidator),
  userController.updateProfile
);
router.get('/:username', userController.getProfile);
router.get('/:username/posts', optionalAuth, userController.getUserPosts);
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);
router.post(
  '/:username/follow',
  authenticate,
  resolveWorkspace,
  enforceReadOnly,
  userController.toggleFollow
);

export default router;
