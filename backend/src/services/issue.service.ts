import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';

interface CreateIssueData {
  auditId: string;
  section: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  locationDescription?: string;
  category: string;
  severity: string;
  title: string;
  description?: string;
  reportedBy?: string;
}

interface UpdateIssueData {
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  locationDescription?: string;
  category?: string;
  severity?: string;
  title?: string;
  description?: string;
  laResponse?: string;
  laStatus?: string;
  resolutionNotes?: string;
  estimatedCostEuros?: number;
  actualCostEuros?: number;
}

export class IssueService {
  /**
   * Create a new issue
   */
  async create(userId: string, data: CreateIssueData) {
    // Verify audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: data.auditId },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    // Convert location to PostGIS Point
    const location = `POINT(${data.location.longitude} ${data.location.latitude})`;

    // Create issue
    const issue = await prisma.issue.create({
      data: {
        auditId: data.auditId,
        section: data.section as any,
        location,
        locationDescription: data.locationDescription,
        locationAccuracyMeters: data.location.accuracy,
        category: data.category as any,
        severity: data.severity as any,
        title: data.title,
        description: data.description,
        reportedBy: data.reportedBy || null,
        laStatus: 'open',
      },
    });

    // Invalidate cache
    await redis.del(`audit:${data.auditId}:issues`);

    logger.info(`Issue created: ${issue.id} by user ${userId}`);

    return issue;
  }

  /**
   * Get issue by ID
   */
  async getById(issueId: string) {
    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId,
        deletedAt: null,
      },
      include: {
        audit: {
          select: {
            id: true,
            routeId: true,
            auditDate: true,
          },
        },
        reporter: {
          select: {
            id: true,
            ageGroup: true,
            sex: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
        photos: {
          where: { deletedAt: null },
        },
      },
    });

    if (!issue) {
      throw new ApiError('Issue not found', 404);
    }

    return issue;
  }

  /**
   * List issues
   */
  async list(filters: {
    auditId?: string;
    section?: string;
    category?: string;
    severity?: string;
    laStatus?: string;
    county?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      auditId,
      section,
      category,
      severity,
      laStatus,
      county,
      limit = 20,
      offset = 0,
    } = filters;

    const where: any = {
      deletedAt: null,
    };

    if (auditId) {
      where.auditId = auditId;
    }

    if (section) {
      where.section = section;
    }

    if (category) {
      where.category = category;
    }

    if (severity) {
      where.severity = severity;
    }

    if (laStatus) {
      where.laStatus = laStatus;
    }

    if (county) {
      where.audit = {
        route: {
          county,
        },
      };
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          audit: {
            select: {
              id: true,
              routeId: true,
              auditDate: true,
              route: {
                select: {
                  name: true,
                  townCity: true,
                  county: true,
                },
              },
            },
          },
          _count: {
            select: {
              photos: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.issue.count({ where }),
    ]);

    return {
      issues,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update issue
   */
  async update(issueId: string, userId: string, data: UpdateIssueData) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new ApiError('Issue not found', 404);
    }

    // Convert location if provided
    let location = issue.location;
    if (data.location) {
      location = `POINT(${data.location.longitude} ${data.location.latitude})`;
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        location,
        locationDescription: data.locationDescription,
        locationAccuracyMeters: data.location?.accuracy,
        category: data.category as any,
        severity: data.severity as any,
        title: data.title,
        description: data.description,
        laResponse: data.laResponse,
        laStatus: data.laStatus,
        resolutionNotes: data.resolutionNotes,
        estimatedCostEuros: data.estimatedCostEuros,
        actualCostEuros: data.actualCostEuros,
      },
    });

    // Invalidate cache
    await redis.del(`audit:${issue.auditId}:issues`);

    logger.info(`Issue updated: ${issueId} by user ${userId}`);

    return updatedIssue;
  }

  /**
   * Acknowledge issue (LA Admin)
   */
  async acknowledge(issueId: string, userId: string, response: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new ApiError('Issue not found', 404);
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        laAcknowledged: true,
        laAcknowledgedAt: new Date(),
        laAcknowledgedBy: userId,
        laResponse: response,
        laStatus: 'acknowledged',
      },
    });

    // Invalidate cache
    await redis.del(`audit:${issue.auditId}:issues`);

    logger.info(`Issue acknowledged: ${issueId} by user ${userId}`);

    return updatedIssue;
  }

  /**
   * Resolve issue (LA Admin)
   */
  async resolve(issueId: string, userId: string, notes: string, cost?: number) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new ApiError('Issue not found', 404);
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: notes,
        actualCostEuros: cost,
        laStatus: 'resolved',
      },
    });

    // Invalidate cache
    await redis.del(`audit:${issue.auditId}:issues`);

    logger.info(`Issue resolved: ${issueId} by user ${userId}`);

    return updatedIssue;
  }

  /**
   * Verify issue (LA Admin)
   */
  async verify(issueId: string, userId: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new ApiError('Issue not found', 404);
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: userId,
      },
    });

    // Invalidate cache
    await redis.del(`audit:${issue.auditId}:issues`);

    logger.info(`Issue verified: ${issueId} by user ${userId}`);

    return updatedIssue;
  }

  /**
   * Delete issue
   */
  async delete(issueId: string, userId: string) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new ApiError('Issue not found', 404);
    }

    // Check permissions (only coordinator or admin)
    const audit = await prisma.audit.findUnique({
      where: { id: issue.auditId },
      select: { coordinatorId: true },
    });

    if (audit?.coordinatorId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403);
      }
    }

    // Soft delete
    await prisma.issue.update({
      where: { id: issueId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidate cache
    await redis.del(`audit:${issue.auditId}:issues`);

    logger.info(`Issue deleted: ${issueId} by user ${userId}`);
  }
}

export const issueService = new IssueService();

