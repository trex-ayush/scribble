import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerValidator), authController.register);
router.post('/login', validate(loginValidator), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
