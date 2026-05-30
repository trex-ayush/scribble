import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const _handleMongooseError = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return ApiError.conflict(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
  }
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', errors);
  }
  if (err.name === 'CastError') return ApiError.badRequest(`Invalid ${err.path}`);
  return null;
};

export const errorMiddleware = (err, req, res, next) => {
  const mapped = _handleMongooseError(err);
  const error = mapped || err;

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error';

  if (!error.isOperational) console.error('[ERROR]', err);

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    ...(env.isDev && { stack: err.stack }),
  });
};

export const notFoundMiddleware = (req, res, next) =>
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
