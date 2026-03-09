import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';

export class AnalyticsService {
  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(userId?: string, county?: string) {
    const cacheKey = `analytics:dashboard:${userId || 'all'}:${county || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
      deletedAt: null,
      status: 'completed',
    };

    if (userId) {
      where.coordinatorId = userId;
    }

    if (county) {
      where.route = {
        county,
      };
    }

    const [
      totalAudits,
      totalRoutes,
      totalIssues,
      totalRecommendations,
      avgScore,
      auditsByMonth,
      topIssues,
      countyBreakdown,
    ] = await Promise.all([
      // Total audits
      prisma.audit.count({ where }),

      // Total routes
      prisma.route.count({
        where: {
          deletedAt: null,
          ...(county ? { county } : {}),
        },
      }),

      // Total issues
      prisma.issue.count({
        where: {
          deletedAt: null,
          ...(county
            ? {
                audit: {
                  route: {
                    county,
                  },
                },
              }
            : {}),
        },
      }),

      // Total recommendations
      prisma.recommendation.count({
        where: {
          deletedAt: null,
          ...(county
            ? {
                audit: {
                  route: {
                    county,
                  },
                },
              }
            : {}),
        },
      }),

      // Average score
      prisma.audit.aggregate({
        where,
        _avg: {
          normalizedScore: true,
        },
      }),

      // Audits by month
      this.getAuditsByMonth(where),

      // Top issues
      this.getTopIssues(county),

      // County breakdown
      this.getCountyBreakdown(),
    ]);

    const analytics = {
      overview: {
        totalAudits,
        totalRoutes,
        totalIssues,
        totalRecommendations,
        avgScore: avgScore._avg.normalizedScore || 0,
      },
      trends: {
        auditsByMonth,
      },
      topIssues,
      countyBreakdown,
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(analytics));

    return analytics;
  }

  /**
   * Get audit trends
   */
  async getAuditTrends(startDate?: string, endDate?: string, county?: string) {
    const cacheKey = `analytics:trends:${startDate || 'all'}:${endDate || 'all'}:${county || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
      deletedAt: null,
      status: 'completed',
    };

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

    const trends = await this.getAuditsByMonth(where);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(trends));

    return trends;
  }

  /**
   * Get top issues
   */
  async getTopIssues(county?: string, limit: number = 10) {
    const cacheKey = `analytics:top-issues:${county || 'all'}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
      deletedAt: null,
    };

    if (county) {
      where.audit = {
        route: {
          county,
        },
      };
    }

    const issues = await prisma.issue.groupBy({
      by: ['category'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    const topIssues = issues.map((issue: any) => ({
      category: issue.category,
      count: issue._count.id,
    }));

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(topIssues));

    return topIssues;
  }

  /**
   * Get county breakdown
   */
  async getCountyBreakdown() {
    const cacheKey = 'analytics:county-breakdown';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const counties = await prisma.route.groupBy({
      by: ['county'],
      where: {
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const breakdown = await Promise.all(
      counties.map(async (county: any) => {
        const audits = await prisma.audit.aggregate({
          where: {
            deletedAt: null,
            status: 'completed',
            route: {
              county: county.county,
            },
          },
          _count: true,
          _avg: {
            normalizedScore: true,
          },
        });

        return {
          county: county.county,
          routeCount: county._count.id,
          auditCount: audits._count,
          avgScore: audits._avg.normalizedScore || 0,
        };
      })
    );

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(breakdown));

    return breakdown;
  }

  /**
   * Get route analytics
   */
  async getRouteAnalytics(routeId: string) {
    const cacheKey = `analytics:route:${routeId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        audits: {
          where: {
            deletedAt: null,
            status: 'completed',
          },
        },
      },
    });

    if (!route) {
      throw new ApiError('Route not found', 404);
    }

    const analytics = {
      route: {
        id: route.id,
        name: route.name,
        county: route.county,
        townCity: route.townCity,
      },
      audits: {
        total: route.audits.length,
        avgScore: route.avgScore || 0,
        lastAudited: route.lastAudited,
      },
      issues: await prisma.issue.count({
        where: {
          deletedAt: null,
          audit: {
            routeId,
          },
        },
      }),
      recommendations: await prisma.recommendation.count({
        where: {
          deletedAt: null,
          audit: {
            routeId,
          },
        },
      }),
    };

    // Cache for 30 minutes
    await redis.setex(cacheKey, 1800, JSON.stringify(analytics));

    return analytics;
  }

  /**
   * Get audits by month
   */
  private async getAuditsByMonth(where: any) {
    // This would ideally use SQL date functions, but Prisma doesn't support this directly
    // So we'll fetch all and group in memory (for small datasets)
    const audits = await prisma.audit.findMany({
      where,
      select: {
        auditDate: true,
        normalizedScore: true,
      },
      orderBy: {
        auditDate: 'asc',
      },
    });

    // Group by month
    const byMonth: Record<string, { count: number; avgScore: number; totalScore: number }> = {};

    audits.forEach((audit: any) => {
      const month = audit.auditDate.toISOString().slice(0, 7); // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      byMonth[month].count++;
      if (audit.normalizedScore) {
        byMonth[month].totalScore += audit.normalizedScore;
      }
    });

    // Calculate averages
    return Object.entries(byMonth).map(([month, data]) => ({
      month,
      count: data.count,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0,
    }));
  }
}

export const analyticsService = new AnalyticsService();

