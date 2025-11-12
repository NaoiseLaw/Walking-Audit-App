import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.config';
import { ApiError } from './error.middleware';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authentication required', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      role: string;
    };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new ApiError('User not found or inactive', 401);
    }

    if (!user.emailVerified && process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
      throw new ApiError('Email not verified', 403);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('Token expired', 401));
    } else {
      next(new ApiError('Authentication failed', 401));
    }
  }
}

