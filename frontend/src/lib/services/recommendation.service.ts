import { supabase, toCamel } from '@/lib/supabase-admin'
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
    const { data: audit } = await supabase
      .from('audits')
      .select('id')
      .eq('id', data.auditId)
      .maybeSingle()
    if (!audit) throw new ApiError('Audit not found', 404)

    const issueCount = data.relatedIssueIds?.length || 0

    const { data: recommendation, error } = await supabase
      .from('recommendations')
      .insert({
        audit_id: data.auditId,
        priority: data.priority,
        title: data.title,
        description: data.description,
        rationale: data.rationale,
        related_issue_ids: data.relatedIssueIds || [],
        issue_count: issueCount,
        estimated_cost_euros: data.estimatedCostEuros,
        estimated_timeframe: data.estimatedTimeframe,
        complexity: data.complexity,
        category: data.category,
        la_status: 'pending',
      })
      .select()
      .single()

    if (error) throw new ApiError('Failed to create recommendation', 500)

    await redis.del(`audit:${data.auditId}:recommendations`)
    logger.info(`Recommendation created: ${recommendation.id} by user ${userId}`)
    return toCamel(recommendation)
  }

  async getById(recommendationId: string) {
    const { data: recommendation } = await supabase
      .from('recommendations')
      .select(`
        *,
        audit:audits(id, route_id, audit_date, route:routes(name, town_city, county))
      `)
      .eq('id', recommendationId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!recommendation) throw new ApiError('Recommendation not found', 404)
    return toCamel(recommendation)
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

    let query = supabase
      .from('recommendations')
      .select(`
        *,
        audit:audits(id, route_id, audit_date, route:routes(name, town_city, county))
      `, { count: 'exact' })
      .is('deleted_at', null)

    if (auditId) query = query.eq('audit_id', auditId)
    if (laStatus) query = query.eq('la_status', laStatus)
    if (category) query = query.eq('category', category)
    if (priority) query = query.eq('priority', priority)

    const { data: recommendations, count, error } = await query
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new ApiError('Failed to list recommendations', 500)

    let results = recommendations || []
    if (county) {
      results = results.filter((r: any) => r.audit?.route?.county === county)
    }

    const total = count || 0
    return {
      recommendations: toCamel(results),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    }
  }

  async update(recommendationId: string, userId: string, data: UpdateRecommendationData) {
    const { data: recommendation } = await supabase
      .from('recommendations')
      .select('id, audit_id, issue_count')
      .eq('id', recommendationId)
      .maybeSingle()
    if (!recommendation) throw new ApiError('Recommendation not found', 404)

    const issueCount = data.relatedIssueIds !== undefined
      ? data.relatedIssueIds.length
      : recommendation.issue_count

    const updatePayload: any = { issue_count: issueCount }
    if (data.priority !== undefined) updatePayload.priority = data.priority
    if (data.title !== undefined) updatePayload.title = data.title
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.rationale !== undefined) updatePayload.rationale = data.rationale
    if (data.relatedIssueIds !== undefined) updatePayload.related_issue_ids = data.relatedIssueIds
    if (data.estimatedCostEuros !== undefined) updatePayload.estimated_cost_euros = data.estimatedCostEuros
    if (data.estimatedTimeframe !== undefined) updatePayload.estimated_timeframe = data.estimatedTimeframe
    if (data.complexity !== undefined) updatePayload.complexity = data.complexity
    if (data.category !== undefined) updatePayload.category = data.category
    if (data.laResponse !== undefined) updatePayload.la_response = data.laResponse
    if (data.laStatus !== undefined) updatePayload.la_status = data.laStatus
    if (data.rejectionReason !== undefined) updatePayload.rejection_reason = data.rejectionReason
    if (data.implementationNotes !== undefined) updatePayload.implementation_notes = data.implementationNotes
    if (data.implementationCostEuros !== undefined) updatePayload.implementation_cost_euros = data.implementationCostEuros
    if (data.verificationNotes !== undefined) updatePayload.verification_notes = data.verificationNotes

    const { data: updated, error } = await supabase
      .from('recommendations')
      .update(updatePayload)
      .eq('id', recommendationId)
      .select()
      .single()

    if (error) throw new ApiError('Failed to update recommendation', 500)

    await redis.del(`audit:${recommendation.audit_id}:recommendations`)
    logger.info(`Recommendation updated: ${recommendationId} by user ${userId}`)
    return toCamel(updated)
  }

  async respond(recommendationId: string, userId: string, response: string, status: string, rejectionReason?: string) {
    const { data: recommendation } = await supabase
      .from('recommendations')
      .select('id, audit_id')
      .eq('id', recommendationId)
      .maybeSingle()
    if (!recommendation) throw new ApiError('Recommendation not found', 404)

    const { data: updated } = await supabase
      .from('recommendations')
      .update({
        la_response: response,
        la_response_date: new Date().toISOString(),
        la_responded_by: userId,
        la_status: status,
        rejection_reason: status === 'rejected' ? rejectionReason : null,
      })
      .eq('id', recommendationId)
      .select()
      .single()

    await redis.del(`audit:${recommendation.audit_id}:recommendations`)
    return toCamel(updated)
  }

  async delete(recommendationId: string, userId: string) {
    const { data: recommendation } = await supabase
      .from('recommendations')
      .select('id, audit_id')
      .eq('id', recommendationId)
      .maybeSingle()
    if (!recommendation) throw new ApiError('Recommendation not found', 404)

    const { data: audit } = await supabase
      .from('audits')
      .select('coordinator_id')
      .eq('id', recommendation.audit_id)
      .maybeSingle()

    if (audit?.coordinator_id !== userId) {
      const { data: user } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    await supabase
      .from('recommendations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', recommendationId)
    await redis.del(`audit:${recommendation.audit_id}:recommendations`)
    logger.info(`Recommendation deleted: ${recommendationId} by user ${userId}`)
  }
}

export const recommendationService = new RecommendationService()
