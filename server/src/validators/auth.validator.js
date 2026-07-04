import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }).withMessage('Name too long'),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // Optional — auto-generated if omitted.
  body('username')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((v) => String(v).toLowerCase())
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-z0-9_]+$/).withMessage('Username: lowercase letters, numbers, underscores only'),
];

export const loginValidator = [
  // Either `identifier` (email or username) or legacy `email` must be present.
  body('identifier')
    .if(body('email').not().exists())
    .trim()
    .notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password required'),
];
