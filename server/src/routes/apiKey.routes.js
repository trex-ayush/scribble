import { Router } from 'express';
import { apiKeyController } from '../controllers/apiKey.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { blockImpersonation } from '../middleware/workspace.middleware.js';

// Managed by the logged-in user (cookie/JWT), not by Basic Auth.
// Blocked while impersonating another account (shared-block).
const router = Router();
router.use(authenticate, blockImpersonation);

router.get('/', apiKeyController.getSettings);
router.post('/generate', apiKeyController.generate);
router.patch('/toggle', apiKeyController.setEnabled);
router.delete('/', apiKeyController.revoke);

export default router;
