// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/walkingaudit_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock external services
jest.mock('../config/database.config');
jest.mock('../config/redis.config');

