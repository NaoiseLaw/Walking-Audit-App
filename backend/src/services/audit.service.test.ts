import { auditService } from './audit.service';
import { prisma } from '../config/database.config';

// Mock Prisma
jest.mock('../config/database.config', () => ({
  prisma: {
    audit: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    route: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditSection: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditParticipant: {
      create: jest.fn(),
    },
    participantAbility: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock Redis
jest.mock('../config/redis.config', () => ({
  redis: {
    del: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an audit successfully', async () => {
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

      const result = await auditService.create('user-1', {
        routeId: 'route-1',
        auditDate: '2025-01-15',
      });

      expect(result).toEqual(mockAudit);
      expect(prisma.route.findUnique).toHaveBeenCalledWith({
        where: { id: 'route-1' },
      });
    });

    it('should throw error if route not found', async () => {
      (prisma.route.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        auditService.create('user-1', {
          routeId: 'invalid-route',
          auditDate: '2025-01-15',
        })
      ).rejects.toThrow('Route not found');
    });
  });

  describe('getById', () => {
    it('should get audit by ID', async () => {
      const mockAudit = {
        id: 'audit-1',
        routeId: 'route-1',
        coordinatorId: 'user-1',
      };

      (prisma.audit.findUnique as jest.Mock).mockResolvedValue(mockAudit);

      const result = await auditService.getById('audit-1', 'user-1');

      expect(result).toEqual(mockAudit);
      expect(prisma.audit.findUnique).toHaveBeenCalledWith({
        where: { id: 'audit-1' },
        include: expect.any(Object),
      });
    });

    it('should throw error if audit not found', async () => {
      (prisma.audit.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(auditService.getById('invalid-audit', 'user-1')).rejects.toThrow(
        'Audit not found'
      );
    });
  });

  describe('list', () => {
    it('should list audits with filters', async () => {
      const mockAudits = [
        {
          id: 'audit-1',
          routeId: 'route-1',
          coordinatorId: 'user-1',
        },
      ];

      (prisma.audit.findMany as jest.Mock).mockResolvedValue(mockAudits);
      (prisma.audit.count as jest.Mock).mockResolvedValue(1);

      const result = await auditService.list({
        userId: 'user-1',
        limit: 20,
        offset: 0,
      });

      expect(result.audits).toEqual(mockAudits);
      expect(result.pagination.total).toBe(1);
    });
  });
});

