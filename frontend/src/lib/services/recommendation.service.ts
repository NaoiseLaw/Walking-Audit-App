import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

interface CreateRecommendationData {
  auditId: string
  priority: number
  title: string
  description: string
  rationale?: string
  relatedIssueIds?: string[]
  estimatedCostEuros?: number
  estimatedTimeframe?: string
  complexity?: string
  category?: string
}

interface UpdateRecommendationData {
  priority?: number
  title?: string
  description?: string
  rationale?: string
  relatedIssueIds?: string[]
  estimatedCostEuros?: number
  estimatedTimeframe?: string
  complexity?: string
  category?: string
  laResponse?: string
  laStatus?: string
  rejectionReason?: string
  implementationNotes?: string
  implementationCostEuros?: number
  verificationNotes?: string
}

export class RecommendationService {
  async create(userId: string, data: CreateRecommendationData) {
    const audit = await prisma.audit.findUnique({ where: { id: data.auditId } })
    if (!audit) throw new ApiError('Audit not found', 404)

    const issueCount = data.relatedIssueIds?.length || 0

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
    })

    await redis.del(`audit:${data.auditId}:recommendations`)
    logger.info(`Recommendation created: ${recommendation.id} by user ${userId}`)
    return recommendation
  }

  async getById(recommendationId: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId, deletedAt: null },
      include: {
        audit: {
          select: {
            id: true,
            routeId: true,
            auditDate: true,
            route: { select: { name: true, townCity: true, county: true } },
          },
        },
        responder: { select: { id: true, name: true, organization: true } },
        implementer: { select: { id: true, name: true, organization: true } },
        verifier: { select: { id: true, name: true, organization: true } },
      },
    })

    if (!recommendation) throw new ApiError('Recommendation not found', 404)
    return recommendation
  }

  async list(filters: {
    auditId?: string
    laStatus?: string
    category?: string
    priority?: number
    county?: string
    limit?: number
    offset?: number
  }) {
    const { auditId, laStatus, category, priority, county, limit = 20, offset = 0 } = filters

    const where: any = { deletedAt: null }
    if (auditId) where.auditId = auditId
    if (laStatus) where.laStatus = laStatus
    if (category) where.category = category
    if (priority) where.priority = priority
    if (county) where.audit = { route: { county } }

    const [recommendations, total] = await Promise.all([
      prisma.recommendation.findMany({
        where,
        include: {
          audit: {
            select: {
              id: true,
              routeId: true,
              auditDate: true,
              route: { select: { name: true, townCity: true, county: true } },
            },
          },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.recommendation.count({ where }),
    ])

    return { recommendations, pagination: { total, limit, offset, hasMore: offset + limit < total } }
  }

  async update(recommendationId: string, userId: string, data: UpdateRecommendationData) {
    const recommendation = await prisma.recommendation.findUnique({ where: { id: recommendationId } })
    if (!recommendation) throw new ApiError('Recommendation not found', 404)

    let issueCount = recommendation.issueCount
    if (data.relatedIssueIds !== undefined) {
      issueCount = data.relatedIssueIds.length
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
    })

    await redis.del(`audit:${recommendation.auditId}:recommendations`)
    logger.info(`Recommendation updated: ${recommendationId} by user ${userId}`)
    return updatedRecommendation
  }

  async respond(recommendationId: string, userId: string, response: string, status: string, rejectionReason?: string) {
    const recommendation = await prisma.recommendation.findUnique({ where: { id: recommendationId } })
    if (!recommendation) throw new ApiError('Recommendation not found', 404)

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        laResponse: response,
        laResponseDate: new Date(),
        laRespondedBy: userId,
        laStatus: status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
      },
    })

    await redis.del(`audit:${recommendation.auditId}:recommendations`)
    return updatedRecommendation
  }

  async delete(recommendationId: string, userId: string) {
    const recommendation = await prisma.recommendation.findUnique({ where: { id: recommendationId } })
    if (!recommendation) throw new ApiError('Recommendation not found', 404)

    const audit = await prisma.audit.findUnique({
      where: { id: recommendation.auditId },
      select: { coordinatorId: true },
    })

    if (audit?.coordinatorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    await prisma.recommendation.update({ where: { id: recommendationId }, data: { deletedAt: new Date() } })
    await redis.del(`audit:${recommendation.auditId}:recommendations`)
    logger.info(`Recommendation deleted: ${recommendationId} by user ${userId}`)
  }
}

export const recommendationService = new RecommendationService()
