import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  errors?: Array<{ field: string; message: string; code?: string }>;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    status: err.status || err.statusCode || 500,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Determine error type
  const errorType = getErrorType(statusCode);

  // Build error response (RFC 7807 format)
  const errorResponse = {
    type: `https://api.walkingaudit.ie/errors/${errorType}`,
    title: err.message || 'Internal Server Error',
    status: statusCode,
    detail: err.message || 'An unexpected error occurred',
    instance: req.path,
    ...(err.errors && { errors: err.errors }),
  };

  // Don't leak internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.detail = 'An internal server error occurred';
  }

  res.status(statusCode).json(errorResponse);
}

function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'validation-error';
    case 401:
      return 'authentication-error';
    case 403:
      return 'authorization-error';
    case 404:
      return 'not-found';
    case 409:
      return 'conflict';
    case 422:
      return 'unprocessable-entity';
    case 429:
      return 'rate-limit-exceeded';
    case 500:
      return 'internal-server-error';
    case 502:
      return 'bad-gateway';
    case 503:
      return 'service-unavailable';
    default:
      return 'error';
  }
}

