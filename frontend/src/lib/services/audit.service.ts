import { supabase, toCamel } from '@/lib/supabase-admin'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

interface CreateAuditData {
  routeId: string
  auditDate: string
  startTime?: string
  endTime?: string
  weather?: string
  temperatureCelsius?: number
  isSchoolRoute?: boolean
  schoolName?: string
  peakTime?: boolean
  enjoyabilityRating?: number
  wouldWalkMore?: boolean
  wouldRecommend?: boolean
  likedMost?: string
  dislikedMost?: string
  additionalComments?: string
  participants?: Array<{
    userId?: string
    ageGroup: string
    sex?: string
    abilities?: string[]
  }>
  sections?: Array<{
    section: string
    score: number
    responses: Record<string, any>
    comments?: string
    problemAreas?: string[]
  }>
}

interface UpdateAuditData {
  auditDate?: string
  startTime?: string
  endTime?: string
  weather?: string
  temperatureCelsius?: number
  isSchoolRoute?: boolean
  schoolName?: string
  peakTime?: boolean
  enjoyabilityRating?: number
  wouldWalkMore?: boolean
  wouldRecommend?: boolean
  likedMost?: string
  dislikedMost?: string
  additionalComments?: string
  status?: string
  sections?: Array<{
    section: string
    score: number
    responses: Record<string, any>
    comments?: string
    problemAreas?: string[]
  }>
}

export class AuditService {
  async create(userId: string, data: CreateAuditData) {
    const { data: route } = await supabase
      .from('routes')
      .select('id')
      .eq('id', data.routeId)
      .maybeSingle()
    if (!route) throw new ApiError('Route not found', 404)

    let durationMinutes: number | null = null
    if (data.startTime && data.endTime) {
      const start = this.parseTime(data.startTime)
      const end = this.parseTime(data.endTime)
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60)
    }

    const { data: newAudit, error } = await supabase
      .from('audits')
      .insert({
        route_id: data.routeId,
        coordinator_id: userId,
        audit_date: data.auditDate,
        start_time: data.startTime,
        end_time: data.endTime,
        duration_minutes: durationMinutes,
        weather: data.weather,
        temperature_celsius: data.temperatureCelsius,
        is_school_route: data.isSchoolRoute || false,
        school_name: data.schoolName,
        peak_time: data.peakTime || false,
        enjoyability_rating: data.enjoyabilityRating,
        would_walk_more: data.wouldWalkMore,
        would_recommend: data.wouldRecommend,
        liked_most: data.likedMost,
        disliked_most: data.dislikedMost,
        additional_comments: data.additionalComments,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw new ApiError('Failed to create audit', 500)

    if (data.participants && data.participants.length > 0) {
      for (const participant of data.participants) {
        const { data: p } = await supabase
          .from('audit_participants')
          .insert({
            audit_id: newAudit.id,
            user_id: participant.userId,
            age_group: participant.ageGroup,
            sex: participant.sex,
          })
          .select()
          .single()

        if (p && participant.abilities && participant.abilities.length > 0) {
          await supabase.from('participant_abilities').insert(
            participant.abilities.map((ability) => ({
              participant_id: p.id,
              ability,
            }))
          )
        }
      }
    }

    if (data.sections && data.sections.length > 0) {
      await supabase.from('audit_sections').insert(
        data.sections.map((section) => ({
          audit_id: newAudit.id,
          section: section.section,
          score: section.score,
          responses: section.responses,
          comments: section.comments,
          problem_areas: section.problemAreas || [],
        }))
      )
    }

    await this.calculateAuditScores(newAudit.id)
    await this.updateRouteStats(data.routeId)
    await redis.del(`audit:${newAudit.id}`)
    await redis.del(`route:${data.routeId}:audits`)

    logger.info(`Audit created: ${newAudit.id} by user ${userId}`)
    return toCamel(newAudit)
  }

  async getById(auditId: string, userId: string) {
    const cacheKey = `audit:${auditId}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const { data: audit } = await supabase
      .from('audits')
      .select(`
        *,
        route:routes(*),
        coordinator:users!coordinator_id(id, name, email, organization),
        participants:audit_participants(*, abilities:participant_abilities(*)),
        sections:audit_sections(*),
        issues(*),
        photos(*),
        recommendations(*)
      `)
      .eq('id', auditId)
      .maybeSingle()

    if (!audit) throw new ApiError('Audit not found', 404)

    if (audit.coordinator_id !== userId) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    // Filter soft-deleted nested records
    const result = {
      ...audit,
      issues: (audit.issues || []).filter((i: any) => !i.deleted_at),
      photos: (audit.photos || []).filter((p: any) => !p.deleted_at),
      recommendations: (audit.recommendations || []).filter((r: any) => !r.deleted_at),
    }

    const camelResult = toCamel(result)
    await redis.setex(cacheKey, 300, JSON.stringify(camelResult))
    return camelResult
  }

  async list(filters: {
    userId?: string
    routeId?: string
    status?: string
    county?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }) {
    const { userId, routeId, status, county, startDate, endDate, limit = 20, offset = 0 } = filters

    let query = supabase
      .from('audits')
      .select(`
        *,
        route:routes(id, name, town_city, county),
        coordinator:users!coordinator_id(id, name, organization)
      `, { count: 'exact' })
      .is('deleted_at', null)

    if (userId) query = query.eq('coordinator_id', userId)
    if (routeId) query = query.eq('route_id', routeId)
    if (status) query = query.eq('status', status)
    if (startDate) query = query.gte('audit_date', startDate)
    if (endDate) query = query.lte('audit_date', endDate)

    const { data: audits, count, error } = await query
      .order('audit_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new ApiError('Failed to list audits', 500)

    let results = audits || []
    if (county) {
      results = results.filter((a: any) => a.route?.county === county)
    }

    const total = count || 0
    return {
      audits: toCamel(results),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    }
  }

  async update(auditId: string, userId: string, data: UpdateAuditData) {
    const { data: audit } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .maybeSingle()
    if (!audit) throw new ApiError('Audit not found', 404)

    if (audit.coordinator_id !== userId) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    let durationMinutes = audit.duration_minutes
    if (data.startTime && data.endTime) {
      const start = this.parseTime(data.startTime)
      const end = this.parseTime(data.endTime)
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60)
    }

    const updatePayload: any = {
      duration_minutes: durationMinutes,
      version: (audit.version || 0) + 1,
    }
    if (data.auditDate !== undefined) updatePayload.audit_date = data.auditDate
    if (data.startTime !== undefined) updatePayload.start_time = data.startTime
    if (data.endTime !== undefined) updatePayload.end_time = data.endTime
    if (data.weather !== undefined) updatePayload.weather = data.weather
    if (data.temperatureCelsius !== undefined) updatePayload.temperature_celsius = data.temperatureCelsius
    if (data.isSchoolRoute !== undefined) updatePayload.is_school_route = data.isSchoolRoute
    if (data.schoolName !== undefined) updatePayload.school_name = data.schoolName
    if (data.peakTime !== undefined) updatePayload.peak_time = data.peakTime
    if (data.enjoyabilityRating !== undefined) updatePayload.enjoyability_rating = data.enjoyabilityRating
    if (data.wouldWalkMore !== undefined) updatePayload.would_walk_more = data.wouldWalkMore
    if (data.wouldRecommend !== undefined) updatePayload.would_recommend = data.wouldRecommend
    if (data.likedMost !== undefined) updatePayload.liked_most = data.likedMost
    if (data.dislikedMost !== undefined) updatePayload.disliked_most = data.dislikedMost
    if (data.additionalComments !== undefined) updatePayload.additional_comments = data.additionalComments
    if (data.status !== undefined) {
      updatePayload.status = data.status
      if (data.status === 'completed') updatePayload.completed_at = new Date().toISOString()
    }

    const { data: updatedAudit, error } = await supabase
      .from('audits')
      .update(updatePayload)
      .eq('id', auditId)
      .select()
      .single()

    if (error) throw new ApiError('Failed to update audit', 500)

    if (data.sections) {
      await supabase.from('audit_sections').delete().eq('audit_id', auditId)
      if (data.sections.length > 0) {
        await supabase.from('audit_sections').insert(
          data.sections.map((section) => ({
            audit_id: auditId,
            section: section.section,
            score: section.score,
            responses: section.responses,
            comments: section.comments,
            problem_areas: section.problemAreas || [],
          }))
        )
      }
    }

    await this.calculateAuditScores(auditId)
    await redis.del(`audit:${auditId}`)
    await redis.del(`route:${updatedAudit.route_id}:audits`)

    logger.info(`Audit updated: ${auditId} by user ${userId}`)
    return toCamel(updatedAudit)
  }

  async delete(auditId: string, userId: string) {
    const { data: audit } = await supabase
      .from('audits')
      .select('coordinator_id, route_id')
      .eq('id', auditId)
      .maybeSingle()
    if (!audit) throw new ApiError('Audit not found', 404)

    const { data: user } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
    if (
      audit.coordinator_id !== userId &&
      user?.role !== 'system_admin' &&
      user?.role !== 'la_admin'
    ) {
      throw new ApiError('Insufficient permissions', 403)
    }

    await supabase.from('audits').update({ deleted_at: new Date().toISOString() }).eq('id', auditId)
    await redis.del(`audit:${auditId}`)
    await redis.del(`route:${audit.route_id}:audits`)

    logger.info(`Audit deleted: ${auditId} by user ${userId}`)
  }

  private async calculateAuditScores(auditId: string) {
    const { data: sections } = await supabase
      .from('audit_sections')
      .select('section, score')
      .eq('audit_id', auditId)

    if (!sections || !sections.length) return

    const get = (name: string) => sections.find((s) => s.section === name)?.score
    const footpathsScore = get('footpaths')
    const facilitiesScore = get('facilities')
    const crossingsScore = get('crossing_road')
    const behaviourScore = get('road_user_behaviour')
    const safetyScore = get('safety')
    const lookFeelScore = get('look_and_feel')
    const schoolGatesScore = get('school_gates')

    const scores = [
      footpathsScore, facilitiesScore, crossingsScore, behaviourScore,
      safetyScore, lookFeelScore, schoolGatesScore,
    ].filter((s) => s !== undefined) as number[]

    const totalScore = scores.reduce((sum, s) => sum + s, 0)
    const maxPossibleScore = scores.length * 5
    const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0

    let walkabilityRating: string
    if (normalizedScore >= 0.8) walkabilityRating = 'Excellent'
    else if (normalizedScore >= 0.6) walkabilityRating = 'Good'
    else if (normalizedScore >= 0.4) walkabilityRating = 'OK'
    else if (normalizedScore >= 0.2) walkabilityRating = 'Fair'
    else walkabilityRating = 'Poor'

    await supabase.from('audits').update({
      footpaths_score: footpathsScore,
      facilities_score: facilitiesScore,
      crossings_score: crossingsScore,
      behaviour_score: behaviourScore,
      safety_score: safetyScore,
      look_feel_score: lookFeelScore,
      school_gates_score: schoolGatesScore,
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
      normalized_score: normalizedScore,
      walkability_rating: walkabilityRating,
    }).eq('id', auditId)
  }

  private async updateRouteStats(routeId: string) {
    const { data: audits } = await supabase
      .from('audits')
      .select('normalized_score, audit_date')
      .eq('route_id', routeId)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .order('audit_date', { ascending: false })

    if (!audits) return

    const auditCount = audits.length
    const avgScore = auditCount > 0
      ? audits.reduce((sum, a) => sum + (Number(a.normalized_score) || 0), 0) / auditCount
      : null
    const lastAudited = audits[0]?.audit_date || null

    await supabase.from('routes').update({ audit_count: auditCount, avg_score: avgScore, last_audited: lastAudited }).eq('id', routeId)
  }

  private parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }
}

export const auditService = new AuditService()
