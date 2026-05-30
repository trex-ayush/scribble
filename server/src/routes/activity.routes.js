import { Router } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, activityController.getLogs);

export default router;
