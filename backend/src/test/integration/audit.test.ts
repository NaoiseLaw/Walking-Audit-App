import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database.config';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('../../config/database.config', () => ({
  prisma: {
    audit: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    route: {
      findUnique: jest.fn(),
    },
    auditSection: {
      create: jest.fn(),
    },
    auditParticipant: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Audit API Integration Tests', () => {
  let authToken: string;

  beforeEach(() => {
    // Create a mock JWT token
    authToken = jwt.sign(
      { userId: 'user-1', email: 'test@example.com', role: 'coordinator' },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  describe('POST /v1/audits', () => {
    it('should create an audit', async () => {
      const mockRoute = {
        id: 'route-1',
        name: 'Test Route',
      };

      const mockAudit = {
        id: 'audit-1',
        routeId: 'route-1',
        coordinatorId: 'user-1',
        auditDate: new Date(),
        status: 'draft',
      };

      (prisma.route.findUnique as jest.Mock).mockResolvedValue(mockRoute);
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockAudit);

      const response = await request(app)
        .post('/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          routeId: 'route-1',
          auditDate: '2025-01-15',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/v1/audits').send({
        routeId: 'route-1',
        auditDate: '2025-01-15',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/audits', () => {
    it('should list audits', async () => {
      const mockAudits = [
        {
          id: 'audit-1',
          routeId: 'route-1',
          coordinatorId: 'user-1',
        },
      ];

      (prisma.audit.findMany as jest.Mock).mockResolvedValue(mockAudits);
      (prisma.audit.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/v1/audits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('audits');
      expect(response.body.audits).toHaveLength(1);
    });
  });
});

