import { body } from 'express-validator';
import { WEBHOOK_EVENT_VALUES } from '../models/webhook.model.js';

const urlRule = (chain) =>
  chain
    .trim()
    .isURL({ require_protocol: true, require_tld: false, protocols: ['http', 'https'] })
    .withMessage('Enter a valid http(s) URL');

const eventsRule = (chain) =>
  chain
    .isArray({ min: 1 })
    .withMessage('Select at least one event')
    .bail()
    .custom((arr) => arr.every((e) => WEBHOOK_EVENT_VALUES.includes(e)))
    .withMessage('Unknown event type');

// An object enables Basic Auth, null clears it, absent leaves it unchanged.
const basicAuthRule = body('basicAuth')
  .optional({ nullable: true })
  .custom((v) => {
    if (v === null) return true;
    if (typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid basic auth');
    if (v.username !== undefined && typeof v.username !== 'string') throw new Error('Invalid username');
    if (v.password !== undefined && typeof v.password !== 'string') throw new Error('Invalid password');
    return true;
  });

export const createWebhookValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }).withMessage('Name too long'),
  urlRule(body('url').notEmpty().withMessage('URL is required')),
  eventsRule(body('events')),
  body('retry').optional().isBoolean().withMessage('retry must be a boolean'),
  basicAuthRule,
];

export const updateWebhookValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 60 }),
  urlRule(body('url').optional()),
  eventsRule(body('events').optional()),
  body('active').optional().isBoolean().withMessage('active must be a boolean'),
  body('retry').optional().isBoolean().withMessage('retry must be a boolean'),
  basicAuthRule,
];
