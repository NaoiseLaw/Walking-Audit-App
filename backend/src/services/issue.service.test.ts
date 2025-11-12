import { issueService } from './issue.service';
import { prisma } from '../config/database.config';

jest.mock('../config/database.config');

describe('IssueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an issue successfully', async () => {
      const mockAudit = {
        id: 'audit-1',
        routeId: 'route-1',
      };

      const mockIssue = {
        id: 'issue-1',
        auditId: 'audit-1',
        title: 'Test Issue',
      };

      (prisma.audit.findUnique as jest.Mock).mockResolvedValue(mockAudit);
      (prisma.issue.create as jest.Mock).mockResolvedValue(mockIssue);

      const result = await issueService.create('user-1', {
        auditId: 'audit-1',
        section: 'footpaths',
        location: {
          latitude: 53.3498,
          longitude: -6.2603,
        },
        category: 'footpath',
        severity: 'medium',
        title: 'Test Issue',
      });

      expect(result).toEqual(mockIssue);
      expect(prisma.issue.create).toHaveBeenCalled();
    });

    it('should throw error if audit not found', async () => {
      (prisma.audit.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        issueService.create('user-1', {
          auditId: 'invalid-audit',
          section: 'footpaths',
          location: {
            latitude: 53.3498,
            longitude: -6.2603,
          },
          category: 'footpath',
          severity: 'medium',
          title: 'Test Issue',
        })
      ).rejects.toThrow('Audit not found');
    });
  });
});

