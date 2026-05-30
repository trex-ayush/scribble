import { Router } from 'express';
import { body } from 'express-validator';
import { teamController } from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { blockImpersonation } from '../middleware/workspace.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const inviteValidator = [
  body('username').trim().notEmpty().withMessage('Username or email is required'),
  body('role').isIn(['full', 'read']).withMessage('Role must be full or read'),
];

const roleValidator = [
  body('role').isIn(['full', 'read']).withMessage('Role must be full or read'),
];

const router = Router();
router.use(authenticate);

// Owner manages their team — blocked while impersonating another account.
router.get('/', blockImpersonation, teamController.getTeam);
router.post('/members', blockImpersonation, validate(inviteValidator), teamController.invite);
router.delete('/members/:memberId', blockImpersonation, teamController.removeMember);
router.patch('/members/:memberId/role', blockImpersonation, validate(roleValidator), teamController.updateRole);

// Member views their own teams (allowed even while impersonating).
router.get('/mine', teamController.getMyTeams);

// Member records an "Access Now" event (logged in the owner's account).
router.post('/access/:ownerId', teamController.access);

export default router;
