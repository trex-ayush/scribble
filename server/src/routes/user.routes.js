import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';

const profileValidator = [
  body('name').optional().trim().isLength({ max: 60 }),
  body('bio').optional().trim().isLength({ max: 300 }),
  body('username')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((v) => String(v).toLowerCase())
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-z0-9_]+$/).withMessage('Username: lowercase letters, numbers, underscores only'),
];

const router = Router();

// Specific routes must precede the dynamic ":username" route.
router.get('/search', userController.searchUsers);
// Profile edits and follows are personal actions (like bookmarks) — no workspace context.
router.put(
  '/me/profile',
  authenticate,
  validate(profileValidator),
  userController.updateProfile
);
router.get('/:username', userController.getProfile);
router.get('/:username/posts', optionalAuth, userController.getUserPosts);
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);
router.post('/:username/follow', authenticate, userController.toggleFollow);

export default router;
