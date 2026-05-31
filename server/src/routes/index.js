import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import postRoutes from './post.routes.js';
import commentRoutes from './comment.routes.js';
import activityRoutes from './activity.routes.js';
import apiKeyRoutes from './apiKey.routes.js';
import teamRoutes from './team.routes.js';
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

export default router;
