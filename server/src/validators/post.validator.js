import { body } from 'express-validator';

export const createPostValidator = [
  body('title').optional().trim().isLength({ max: 150 }).withMessage('Title too long'),
  body('content').notEmpty().withMessage('Content required'),
  body('tags').optional().isArray({ max: 5 }).withMessage('Max 5 tags'),
  body('tags.*').optional().trim().isLength({ max: 30 }).withMessage('Tag too long'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status'),
  body('format').optional().isIn(['html', 'markdown']).withMessage('Invalid format'),
];

export const updatePostValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('tags').optional().isArray({ max: 5 }),
  body('tags.*').optional().trim().isLength({ max: 30 }),
  body('status').optional().isIn(['draft', 'published']),
  body('format').optional().isIn(['html', 'markdown']),
];
