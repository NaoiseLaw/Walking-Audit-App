import { supabase, toCamel } from '@/lib/supabase-admin'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

interface CreateIssueData {
  auditId: string
  section: string
  location: { latitude: number; longitude: number; accuracy?: number }
  locationDescription?: string
  category: string
  severity: string
  title: string
  description?: string
  reportedBy?: string
}

interface UpdateIssueData {
  location?: { latitude: number; longitude: number; accuracy?: number }
  locationDescription?: string
  category?: string
  severity?: string
  title?: string
  description?: string
  laResponse?: string
  laStatus?: string
  resolutionNotes?: string
  estimatedCostEuros?: number
  actualCostEuros?: number
}

export class IssueService {
  async create(userId: string, data: CreateIssueData) {
    const { data: audit } = await supabase
      .from('audits')
      .select('id')
      .eq('id', data.auditId)
      .maybeSingle()
    if (!audit) throw new ApiError('Audit not found', 404)

    const location = `POINT(${data.location.longitude} ${data.location.latitude})`

    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
        audit_id: data.auditId,
        section: data.section,
        location,
        location_description: data.locationDescription,
        location_accuracy_meters: data.location.accuracy,
        category: data.category,
        severity: data.severity,
        title: data.title,
        description: data.description,
        reported_by: data.reportedBy || null,
        la_status: 'open',
      })
      .select()
      .single()

    if (error) throw new ApiError('Failed to create issue', 500)

    await redis.del(`audit:${data.auditId}:issues`)
    logger.info(`Issue created: ${issue.id} by user ${userId}`)
    return toCamel(issue)
  }

  async getById(issueId: string) {
    const { data: issue } = await supabase
      .from('issues')
      .select(`
        *,
        audit:audits(id, route_id, audit_date),
        photos(*)
      `)
      .eq('id', issueId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!issue) throw new ApiError('Issue not found', 404)

    const result = {
      ...issue,
      photos: (issue.photos || []).filter((p: any) => !p.deleted_at),
    }

    return toCamel(result)
  }

  async list(filters: {
    auditId?: string
    section?: string
    category?: string
    severity?: string
    laStatus?: string
    county?: string
    limit?: number
    offset?: number
  }) {
    const { auditId, section, category, severity, laStatus, county, limit = 20, offset = 0 } = filters

    let query = supabase
      .from('issues')
      .select(`
        *,
        audit:audits(id, route_id, audit_date, route:routes(name, town_city, county))
      `, { count: 'exact' })
      .is('deleted_at', null)

    if (auditId) query = query.eq('audit_id', auditId)
    if (section) query = query.eq('section', section)
    if (category) query = query.eq('category', category)
    if (severity) query = query.eq('severity', severity)
    if (laStatus) query = query.eq('la_status', laStatus)

    const { data: issues, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new ApiError('Failed to list issues', 500)

    let results = issues || []
    if (county) {
      results = results.filter((i: any) => i.audit?.route?.county === county)
    }

    const total = count || 0
    return {
      issues: toCamel(results),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    }
  }

  async update(issueId: string, userId: string, data: UpdateIssueData) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id, audit_id, location')
      .eq('id', issueId)
      .maybeSingle()
    if (!issue) throw new ApiError('Issue not found', 404)

    const updatePayload: any = {}
    if (data.location) {
      updatePayload.location = `POINT(${data.location.longitude} ${data.location.latitude})`
      updatePayload.location_accuracy_meters = data.location.accuracy
    }
    if (data.locationDescription !== undefined) updatePayload.location_description = data.locationDescription
    if (data.category !== undefined) updatePayload.category = data.category
    if (data.severity !== undefined) updatePayload.severity = data.severity
    if (data.title !== undefined) updatePayload.title = data.title
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.laResponse !== undefined) updatePayload.la_response = data.laResponse
    if (data.laStatus !== undefined) updatePayload.la_status = data.laStatus
    if (data.resolutionNotes !== undefined) updatePayload.resolution_notes = data.resolutionNotes
    if (data.estimatedCostEuros !== undefined) updatePayload.estimated_cost_euros = data.estimatedCostEuros
    if (data.actualCostEuros !== undefined) updatePayload.actual_cost_euros = data.actualCostEuros

    const { data: updatedIssue, error } = await supabase
      .from('issues')
      .update(updatePayload)
      .eq('id', issueId)
      .select()
      .single()

    if (error) throw new ApiError('Failed to update issue', 500)

    await redis.del(`audit:${issue.audit_id}:issues`)
    logger.info(`Issue updated: ${issueId} by user ${userId}`)
    return toCamel(updatedIssue)
  }

  async acknowledge(issueId: string, userId: string, response: string) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id, audit_id')
      .eq('id', issueId)
      .maybeSingle()
    if (!issue) throw new ApiError('Issue not found', 404)

    const { data: updatedIssue } = await supabase
      .from('issues')
      .update({
        la_acknowledged: true,
        la_acknowledged_at: new Date().toISOString(),
        la_acknowledged_by: userId,
        la_response: response,
        la_status: 'acknowledged',
      })
      .eq('id', issueId)
      .select()
      .single()

    await redis.del(`audit:${issue.audit_id}:issues`)
    return toCamel(updatedIssue)
  }

  async resolve(issueId: string, userId: string, notes: string, cost?: number) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id, audit_id')
      .eq('id', issueId)
      .maybeSingle()
    if (!issue) throw new ApiError('Issue not found', 404)

    const { data: updatedIssue } = await supabase
      .from('issues')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_notes: notes,
        actual_cost_euros: cost,
        la_status: 'resolved',
      })
      .eq('id', issueId)
      .select()
      .single()

    await redis.del(`audit:${issue.audit_id}:issues`)
    return toCamel(updatedIssue)
  }

  async delete(issueId: string, userId: string) {
    const { data: issue } = await supabase
      .from('issues')
      .select('id, audit_id')
      .eq('id', issueId)
      .maybeSingle()
    if (!issue) throw new ApiError('Issue not found', 404)

    const { data: audit } = await supabase
      .from('audits')
      .select('coordinator_id')
      .eq('id', issue.audit_id)
      .maybeSingle()

    if (audit?.coordinator_id !== userId) {
      const { data: user } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    await supabase.from('issues').update({ deleted_at: new Date().toISOString() }).eq('id', issueId)
    await redis.del(`audit:${issue.audit_id}:issues`)
    logger.info(`Issue deleted: ${issueId} by user ${userId}`)
  }
}

export const issueService = new IssueService()
