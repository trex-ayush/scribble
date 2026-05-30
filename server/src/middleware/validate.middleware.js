import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schemas) => [
  ...schemas,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formatted = errors.array().map(({ path, msg }) => ({ field: path, message: msg }));
      return next(ApiError.badRequest('Validation failed', formatted));
    }
    next();
  },
];
