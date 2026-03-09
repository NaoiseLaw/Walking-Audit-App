import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';

interface CreateAuditData {
  routeId: string;
  auditDate: string;
  startTime?: string;
  endTime?: string;
  weather?: string;
  temperatureCelsius?: number;
  isSchoolRoute?: boolean;
  schoolName?: string;
  peakTime?: boolean;
  enjoyabilityRating?: number;
  wouldWalkMore?: boolean;
  wouldRecommend?: boolean;
  likedMost?: string;
  dislikedMost?: string;
  additionalComments?: string;
  participants?: Array<{
    userId?: string;
    ageGroup: string;
    sex?: string;
    abilities?: string[];
  }>;
  sections?: Array<{
    section: string;
    score: number;
    responses: Record<string, any>;
    comments?: string;
    problemAreas?: string[];
  }>;
}

interface UpdateAuditData {
  auditDate?: string;
  startTime?: string;
  endTime?: string;
  weather?: string;
  temperatureCelsius?: number;
  isSchoolRoute?: boolean;
  schoolName?: string;
  peakTime?: boolean;
  enjoyabilityRating?: number;
  wouldWalkMore?: boolean;
  wouldRecommend?: boolean;
  likedMost?: string;
  dislikedMost?: string;
  additionalComments?: string;
  status?: string;
  sections?: Array<{
    section: string;
    score: number;
    responses: Record<string, any>;
    comments?: string;
    problemAreas?: string[];
  }>;
}

export class AuditService {
  /**
   * Create a new audit
   */
  async create(userId: string, data: CreateAuditData) {
    // Validate route exists
    const route = await prisma.route.findUnique({
      where: { id: data.routeId },
    });

    if (!route) {
      throw new ApiError('Route not found', 404);
    }

    // Calculate duration if both times provided
    let durationMinutes: number | null = null;
    if (data.startTime && data.endTime) {
      const start = this.parseTime(data.startTime);
      const end = this.parseTime(data.endTime);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    }

    // Create audit in transaction
    const audit = await prisma.$transaction(async (tx: any) => {
      // Create audit
      const newAudit = await tx.audit.create({
        data: {
          routeId: data.routeId,
          coordinatorId: userId,
          auditDate: new Date(data.auditDate),
          startTime: data.startTime,
          endTime: data.endTime,
          durationMinutes,
          weather: data.weather,
          temperatureCelsius: data.temperatureCelsius,
          isSchoolRoute: data.isSchoolRoute || false,
          schoolName: data.schoolName,
          peakTime: data.peakTime || false,
          enjoyabilityRating: data.enjoyabilityRating,
          wouldWalkMore: data.wouldWalkMore,
          wouldRecommend: data.wouldRecommend,
          likedMost: data.likedMost,
          dislikedMost: data.dislikedMost,
          additionalComments: data.additionalComments,
          status: 'draft',
        },
      });

      // Create participants
      if (data.participants && data.participants.length > 0) {
        for (const participant of data.participants) {
          const p = await tx.auditParticipant.create({
            data: {
              auditId: newAudit.id,
              userId: participant.userId,
              ageGroup: participant.ageGroup,
              sex: participant.sex,
            },
          });

          // Add abilities
          if (participant.abilities && participant.abilities.length > 0) {
            await tx.participantAbility.createMany({
              data: participant.abilities.map((ability) => ({
                participantId: p.id,
                ability: ability as any,
              })),
            });
          }
        }
      }

      // Create sections
      if (data.sections && data.sections.length > 0) {
        for (const section of data.sections) {
          await tx.auditSection.create({
            data: {
              auditId: newAudit.id,
              section: section.section as any,
              score: section.score,
              responses: section.responses,
              comments: section.comments,
              problemAreas: section.problemAreas || [],
            },
          });
        }
      }

      return newAudit;
    });

    // Calculate scores (triggers will handle this, but we can also calculate here)
    await this.calculateAuditScores(audit.id);

    // Update route stats
    await this.updateRouteStats(data.routeId);

    // Invalidate cache
    await redis.del(`audit:${audit.id}`);
    await redis.del(`route:${data.routeId}:audits`);

    logger.info(`Audit created: ${audit.id} by user ${userId}`);

    return audit;
  }

  /**
   * Get audit by ID
   */
  async getById(auditId: string, userId: string) {
    // Check cache
    const cacheKey = `audit:${auditId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        route: true,
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
        participants: {
          include: {
            abilities: true,
          },
        },
        sections: true,
        issues: {
          where: { deletedAt: null },
        },
        photos: {
          where: { deletedAt: null },
        },
        recommendations: {
          where: { deletedAt: null },
        },
        reportMetrics: true,
      },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    // Check permissions
    if (audit.coordinatorId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403);
      }
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(audit));

    return audit;
  }

  /**
   * List audits with filters
   */
  async list(filters: {
    userId?: string;
    routeId?: string;
    status?: string;
    county?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      userId,
      routeId,
      status,
      county,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = filters;

    const where: any = {
      deletedAt: null,
    };

    if (userId) {
      where.coordinatorId = userId;
    }

    if (routeId) {
      where.routeId = routeId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.auditDate = {};
      if (startDate) {
        where.auditDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.auditDate.lte = new Date(endDate);
      }
    }

    if (county) {
      where.route = {
        county,
      };
    }

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        include: {
          route: {
            select: {
              id: true,
              name: true,
              townCity: true,
              county: true,
            },
          },
          coordinator: {
            select: {
              id: true,
              name: true,
              organization: true,
            },
          },
          _count: {
            select: {
              participants: true,
              issues: true,
              photos: true,
            },
          },
        },
        orderBy: {
          auditDate: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.audit.count({ where }),
    ]);

    return {
      audits,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update audit
   */
  async update(auditId: string, userId: string, data: UpdateAuditData) {
    // Get existing audit
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    // Check permissions
    if (audit.coordinatorId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403);
      }
    }

    // Calculate duration if times updated
    let durationMinutes = audit.durationMinutes;
    if (data.startTime && data.endTime) {
      const start = this.parseTime(data.startTime);
      const end = this.parseTime(data.endTime);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    }

    // Update audit
    const updatedAudit = await prisma.$transaction(async (tx: any) => {
      const existingAudit = await tx.audit.findUnique({ where: { id: auditId } });
      const updatedRecord = await tx.audit.update({
        where: { id: auditId },
        data: {
          auditDate: data.auditDate ? new Date(data.auditDate) : undefined,
          startTime: data.startTime,
          endTime: data.endTime,
          durationMinutes,
          weather: data.weather,
          temperatureCelsius: data.temperatureCelsius,
          isSchoolRoute: data.isSchoolRoute,
          schoolName: data.schoolName,
          peakTime: data.peakTime,
          enjoyabilityRating: data.enjoyabilityRating,
          wouldWalkMore: data.wouldWalkMore,
          wouldRecommend: data.wouldRecommend,
          likedMost: data.likedMost,
          dislikedMost: data.dislikedMost,
          additionalComments: data.additionalComments,
          status: data.status as any,
          completedAt: data.status === 'completed' ? new Date() : existingAudit?.completedAt,
          version: {
            increment: 1,
          },
        },
      });

      // Update sections if provided
      if (data.sections) {
        // Delete existing sections
        await tx.auditSection.deleteMany({
          where: { auditId },
        });

        // Create new sections
        for (const section of data.sections) {
          await tx.auditSection.create({
            data: {
              auditId,
              section: section.section as any,
              score: section.score,
              responses: section.responses,
              comments: section.comments,
              problemAreas: section.problemAreas || [],
            },
          });
        }
      }

      return updatedRecord;
    });

    // Recalculate scores
    await this.calculateAuditScores(auditId);

    // Invalidate cache
    await redis.del(`audit:${auditId}`);
    await redis.del(`route:${updatedAudit.routeId}:audits`);

    logger.info(`Audit updated: ${auditId} by user ${userId}`);

    return updatedAudit;
  }

  /**
   * Delete audit (soft delete)
   */
  async delete(auditId: string, userId: string) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      audit.coordinatorId !== userId &&
      user?.role !== 'system_admin' &&
      user?.role !== 'la_admin'
    ) {
      throw new ApiError('Insufficient permissions', 403);
    }

    // Soft delete
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidate cache
    await redis.del(`audit:${auditId}`);
    await redis.del(`route:${audit.routeId}:audits`);

    logger.info(`Audit deleted: ${auditId} by user ${userId}`);
  }

  /**
   * Calculate audit scores
   */
  private async calculateAuditScores(auditId: string) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        sections: true,
      },
    });

    if (!audit || !audit.sections.length) {
      return;
    }

    // Calculate section scores
    const sections = audit.sections as any[];
    const footpathsScore = sections.find((s) => s.section === 'footpaths')?.score;
    const facilitiesScore = sections.find((s) => s.section === 'facilities')?.score;
    const crossingsScore = sections.find((s) => s.section === 'crossing_road')?.score;
    const behaviourScore = sections.find((s) => s.section === 'road_user_behaviour')?.score;
    const safetyScore = sections.find((s) => s.section === 'safety')?.score;
    const lookFeelScore = sections.find((s) => s.section === 'look_and_feel')?.score;
    const schoolGatesScore = sections.find((s) => s.section === 'school_gates')?.score;

    // Calculate total score
    const scores = [
      footpathsScore,
      facilitiesScore,
      crossingsScore,
      behaviourScore,
      safetyScore,
      lookFeelScore,
      schoolGatesScore,
    ].filter((s) => s !== undefined) as number[];

    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = scores.length * 5;
    const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

    // Determine walkability rating
    let walkabilityRating: string | null = null;
    if (normalizedScore >= 0.8) {
      walkabilityRating = 'Excellent';
    } else if (normalizedScore >= 0.6) {
      walkabilityRating = 'Good';
    } else if (normalizedScore >= 0.4) {
      walkabilityRating = 'OK';
    } else if (normalizedScore >= 0.2) {
      walkabilityRating = 'Fair';
    } else {
      walkabilityRating = 'Poor';
    }

    // Update audit
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        footpathsScore,
        facilitiesScore,
        crossingsScore,
        behaviourScore,
        safetyScore,
        lookFeelScore,
        schoolGatesScore,
        totalScore,
        maxPossibleScore,
        normalizedScore,
        walkabilityRating,
      },
    });
  }

  /**
   * Update route statistics
   */
  private async updateRouteStats(routeId: string) {
    const stats = await prisma.audit.aggregate({
      where: {
        routeId,
        deletedAt: null,
        status: 'completed',
      },
      _count: true,
      _avg: {
        totalScore: true,
        normalizedScore: true,
      },
    });

    const lastAudited = await prisma.audit.findFirst({
      where: {
        routeId,
        deletedAt: null,
        status: 'completed',
      },
      orderBy: {
        auditDate: 'desc',
      },
      select: {
        auditDate: true,
      },
    });

    await prisma.route.update({
      where: { id: routeId },
      data: {
        auditCount: stats._count,
        avgScore: stats._avg.normalizedScore,
        lastAudited: lastAudited?.auditDate,
      },
    });
  }

  /**
   * Parse time string to Date
   */
  private parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}

export const auditService = new AuditService();

