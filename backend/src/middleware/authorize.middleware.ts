import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from './error.middleware';

export function authorize(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError('Insufficient permissions', 403);
    }

    next();
  };
}

