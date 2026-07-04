import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { blockImpersonation } from '../middleware/workspace.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createWebhookValidator, updateWebhookValidator } from '../validators/webhook.validator.js';

// Managed by the logged-in user (cookie/JWT), not by Basic Auth.
// Blocked while impersonating another account (shared-block, like API keys).
const router = Router();
router.use(authenticate, blockImpersonation);

router.get('/events', webhookController.listEvents);
router.get('/deliveries', webhookController.listDeliveries);
router.get('/deliveries/:id', webhookController.getDelivery);
router.get('/', webhookController.list);
router.get('/:id', webhookController.getOne);
router.post('/', validate(createWebhookValidator), webhookController.create);
router.patch('/:id', validate(updateWebhookValidator), webhookController.update);
router.post('/:id/rotate-secret', webhookController.rotateSecret);
router.post('/:id/test', webhookController.test);
router.delete('/:id', webhookController.remove);

export default router;
