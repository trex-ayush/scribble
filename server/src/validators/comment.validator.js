import { body } from 'express-validator';

export const commentValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment cannot be empty')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];
