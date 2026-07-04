import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import postRoutes from './post.routes.js';
import commentRoutes from './comment.routes.js';
import activityRoutes from './activity.routes.js';
import apiKeyRoutes from './apiKey.routes.js';
import teamRoutes from './team.routes.js';
import notificationRoutes from './notification.routes.js';
import bookmarkRoutes from './bookmark.routes.js';
import webhookRoutes from './webhook.routes.js';
import searchRoutes from './search.routes.js';
import { activityLogger } from '../middleware/activityLog.middleware.js';

const router = Router();

// Centralized activity logging: every non-GET request below is recorded
// automatically (the only place activity is written).
router.use(activityLogger);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/posts', commentRoutes);
router.use('/activity', activityRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/team', teamRoutes);
router.use('/notifications', notificationRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/search', searchRoutes);

export default router;
