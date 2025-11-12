import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role, organization, county } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new ApiError('Email, password, and name are required', 400);
    }

    if (password.length < 8) {
      throw new ApiError('Password must be at least 8 characters', 400);
    }

    const user = await authService.register({
      email,
      password,
      name,
      role,
      organization,
      county,
    });

    res.status(201).json({
      user,
      message: 'User registered successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    const result = await authService.login({ email, password });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError('Refresh token is required', 400);
    }

    const result = await authService.refreshToken(refreshToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement token blacklisting here if needed
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError('Email is required', 400);
    }

    const result = await authService.forgotPassword(email);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ApiError('Token and password are required', 400);
    }

    if (password.length < 8) {
      throw new ApiError('Password must be at least 8 characters', 400);
    }

    const result = await authService.resetPassword(token, password);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError('Verification token is required', 400);
    }

    const result = await authService.verifyEmail(token);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError('Email is required', 400);
    }

    const result = await authService.resendVerification(email);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

