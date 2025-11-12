import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';

interface CreateRecommendationData {
  auditId: string;
  priority: number;
  title: string;
  description: string;
  rationale?: string;
  relatedIssueIds?: string[];
  estimatedCostEuros?: number;
  estimatedTimeframe?: string;
  complexity?: string;
  category?: string;
}

interface UpdateRecommendationData {
  priority?: number;
  title?: string;
  description?: string;
  rationale?: string;
  relatedIssueIds?: string[];
  estimatedCostEuros?: number;
  estimatedTimeframe?: string;
  complexity?: string;
  category?: string;
  laResponse?: string;
  laStatus?: string;
  rejectionReason?: string;
  implementationNotes?: string;
  implementationCostEuros?: number;
  verificationNotes?: string;
}

export class RecommendationService {
  /**
   * Create a new recommendation
   */
  async create(userId: string, data: CreateRecommendationData) {
    // Verify audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: data.auditId },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    // Count related issues
    const issueCount = data.relatedIssueIds?.length || 0;

    // Create recommendation
    const recommendation = await prisma.recommendation.create({
      data: {
        auditId: data.auditId,
        priority: data.priority,
        title: data.title,
        description: data.description,
        rationale: data.rationale,
        relatedIssueIds: data.relatedIssueIds || [],
        issueCount,
        estimatedCostEuros: data.estimatedCostEuros,
        estimatedTimeframe: data.estimatedTimeframe,
        complexity: data.complexity,
        category: data.category,
        laStatus: 'pending',
      },
    });

    // Invalidate cache
    await redis.del(`audit:${data.auditId}:recommendations`);

    logger.info(`Recommendation created: ${recommendation.id} by user ${userId}`);

    return recommendation;
  }

  /**
   * Get recommendation by ID
   */
  async getById(recommendationId: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: {
        id: recommendationId,
        deletedAt: null,
      },
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
        responder: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
        implementer: {
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
      },
    });

    if (!recommendation) {
      throw new ApiError('Recommendation not found', 404);
    }

    return recommendation;
  }

  /**
   * List recommendations
   */
  async list(filters: {
    auditId?: string;
    laStatus?: string;
    category?: string;
    priority?: number;
    county?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      auditId,
      laStatus,
      category,
      priority,
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

    if (laStatus) {
      where.laStatus = laStatus;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (county) {
      where.audit = {
        route: {
          county,
        },
      };
    }

    const [recommendations, total] = await Promise.all([
      prisma.recommendation.findMany({
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
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.recommendation.count({ where }),
    ]);

    return {
      recommendations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update recommendation
   */
  async update(recommendationId: string, userId: string, data: UpdateRecommendationData) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new ApiError('Recommendation not found', 404);
    }

    // Update issue count if related issues changed
    let issueCount = recommendation.issueCount;
    if (data.relatedIssueIds !== undefined) {
      issueCount = data.relatedIssueIds.length;
    }

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        priority: data.priority,
        title: data.title,
        description: data.description,
        rationale: data.rationale,
        relatedIssueIds: data.relatedIssueIds,
        issueCount,
        estimatedCostEuros: data.estimatedCostEuros,
        estimatedTimeframe: data.estimatedTimeframe,
        complexity: data.complexity,
        category: data.category,
        laResponse: data.laResponse,
        laStatus: data.laStatus,
        rejectionReason: data.rejectionReason,
        implementationNotes: data.implementationNotes,
        implementationCostEuros: data.implementationCostEuros,
        verificationNotes: data.verificationNotes,
      },
    });

    // Invalidate cache
    await redis.del(`audit:${recommendation.auditId}:recommendations`);

    logger.info(`Recommendation updated: ${recommendationId} by user ${userId}`);

    return updatedRecommendation;
  }

  /**
   * Respond to recommendation (LA Admin)
   */
  async respond(recommendationId: string, userId: string, response: string, status: string, rejectionReason?: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new ApiError('Recommendation not found', 404);
    }

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        laResponse: response,
        laResponseDate: new Date(),
        laRespondedBy: userId,
        laStatus: status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
      },
    });

    // Invalidate cache
    await redis.del(`audit:${recommendation.auditId}:recommendations`);

    logger.info(`Recommendation responded to: ${recommendationId} by user ${userId}`);

    return updatedRecommendation;
  }

  /**
   * Implement recommendation (LA Admin)
   */
  async implement(recommendationId: string, userId: string, notes: string, cost?: number) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new ApiError('Recommendation not found', 404);
    }

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        implemented: true,
        implementedAt: new Date(),
        implementedBy: userId,
        implementationNotes: notes,
        implementationCostEuros: cost,
      },
    });

    // Invalidate cache
    await redis.del(`audit:${recommendation.auditId}:recommendations`);

    logger.info(`Recommendation implemented: ${recommendationId} by user ${userId}`);

    return updatedRecommendation;
  }

  /**
   * Verify recommendation (LA Admin)
   */
  async verify(recommendationId: string, userId: string, notes: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new ApiError('Recommendation not found', 404);
    }

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: userId,
        verificationNotes: notes,
      },
    });

    // Invalidate cache
    await redis.del(`audit:${recommendation.auditId}:recommendations`);

    logger.info(`Recommendation verified: ${recommendationId} by user ${userId}`);

    return updatedRecommendation;
  }

  /**
   * Delete recommendation
   */
  async delete(recommendationId: string, userId: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      throw new ApiError('Recommendation not found', 404);
    }

    // Check permissions
    const audit = await prisma.audit.findUnique({
      where: { id: recommendation.auditId },
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
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidate cache
    await redis.del(`audit:${recommendation.auditId}:recommendations`);

    logger.info(`Recommendation deleted: ${recommendationId} by user ${userId}`);
  }
}

export const recommendationService = new RecommendationService();

