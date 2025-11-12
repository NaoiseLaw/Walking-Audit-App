import { Request, Response } from 'express';
import { register, login } from './auth.controller';
import { authService } from '../services/auth.service';

// Mock auth service
jest.mock('../services/auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
  },
}));

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'auditor',
        emailVerified: false,
        createdAt: new Date(),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockUser);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return error if email is missing', async () => {
      mockRequest.body = {
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'auditor',
          emailVerified: true,
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResponse);
    });
  });
});

