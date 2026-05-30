import { Router } from 'express';
import { apiKeyController } from '../controllers/apiKey.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Managed by the logged-in user (cookie/JWT), not by Basic Auth.
const router = Router();

router.get('/', authenticate, apiKeyController.getSettings);
router.post('/generate', authenticate, apiKeyController.generate);
router.patch('/toggle', authenticate, apiKeyController.setEnabled);
router.delete('/', authenticate, apiKeyController.revoke);

export default router;
