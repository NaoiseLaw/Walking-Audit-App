import { supabase, toCamel } from '@/lib/supabase-admin'
import { redis } from '@/lib/redis'
import { ApiError } from '@/lib/api-error'

export class AnalyticsService {
  async getDashboardAnalytics(userId?: string, county?: string) {
    const cacheKey = `analytics:dashboard:${userId || 'all'}:${county || 'all'}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    let auditQuery = supabase
      .from('audits')
      .select('id, normalized_score, route:routes(county)', { count: 'exact' })
      .is('deleted_at', null)
      .eq('status', 'completed')
    if (userId) auditQuery = auditQuery.eq('coordinator_id', userId)

    let routeQuery = supabase
      .from('routes')
      .select('id', { count: 'exact' })
      .is('deleted_at', null)

    const issueQuery = supabase
      .from('issues')
      .select('id', { count: 'exact' })
      .is('deleted_at', null)

    const recQuery = supabase
      .from('recommendations')
      .select('id', { count: 'exact' })
      .is('deleted_at', null)

    if (county) {
      routeQuery = routeQuery.eq('county', county)
    }

    const [auditResult, routeResult, issueResult, recResult] = await Promise.all([
      auditQuery,
      routeQuery,
      issueQuery,
      recQuery,
    ])

    let audits = (auditResult.data || []) as any[]
    if (county) {
      audits = audits.filter((a) => a.route?.county === county)
    }

    const totalAudits = audits.length
    const totalRoutes = routeResult.count || 0
    const totalIssues = issueResult.count || 0
    const totalRecommendations = (recResult as any).count || 0
    const avgScore =
      totalAudits > 0
        ? audits.reduce((sum, a) => sum + (Number(a.normalized_score) || 0), 0) / totalAudits
        : 0

    const [auditsByMonth, topIssues, countyBreakdown] = await Promise.all([
      this.getAuditsByMonth(userId, county),
      this.getTopIssues(county),
      this.getCountyBreakdown(),
    ])

    const analytics = {
      overview: { totalAudits, totalRoutes, totalIssues, totalRecommendations, avgScore },
      trends: { auditsByMonth },
      topIssues,
      countyBreakdown,
    }

    await redis.setex(cacheKey, 3600, JSON.stringify(analytics))
    return analytics
  }

  async getAuditTrends(startDate?: string, endDate?: string, county?: string) {
    const cacheKey = `analytics:trends:${startDate || 'all'}:${endDate || 'all'}:${county || 'all'}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const trends = await this.getAuditsByMonth(undefined, county, startDate, endDate)
    await redis.setex(cacheKey, 3600, JSON.stringify(trends))
    return trends
  }

  async getTopIssues(county?: string, limit: number = 10) {
    const cacheKey = `analytics:top-issues:${county || 'all'}:${limit}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const query = supabase
      .from('issues')
      .select('category, audit:audits(route:routes(county))')
      .is('deleted_at', null)

    const { data: issues } = await query

    if (!issues) return []

    let filtered = issues as any[]
    if (county) {
      filtered = filtered.filter((i) => i.audit?.route?.county === county)
    }

    const counts: Record<string, number> = {}
    filtered.forEach((i) => {
      if (i.category) counts[i.category] = (counts[i.category] || 0) + 1
    })

    const topIssues = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([category, count]) => ({ category, count }))

    await redis.setex(cacheKey, 3600, JSON.stringify(topIssues))
    return topIssues
  }

  async getCountyBreakdown() {
    const cacheKey = 'analytics:county-breakdown'
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const { data: routes } = await supabase
      .from('routes')
      .select('county')
      .is('deleted_at', null)

    if (!routes) return []

    const countyCounts: Record<string, number> = {}
    routes.forEach((r) => {
      if (r.county) countyCounts[r.county] = (countyCounts[r.county] || 0) + 1
    })

    const { data: audits } = await supabase
      .from('audits')
      .select('normalized_score, route:routes(county)')
      .is('deleted_at', null)
      .eq('status', 'completed')

    const countyAudits: Record<string, { count: number; totalScore: number }> = {}
    ;(audits || []).forEach((a: any) => {
      const c = a.route?.county
      if (c) {
        if (!countyAudits[c]) countyAudits[c] = { count: 0, totalScore: 0 }
        countyAudits[c].count++
        countyAudits[c].totalScore += Number(a.normalized_score) || 0
      }
    })

    const breakdown = Object.keys(countyCounts).map((county) => ({
      county,
      routeCount: countyCounts[county],
      auditCount: countyAudits[county]?.count || 0,
      avgScore:
        countyAudits[county]?.count
          ? countyAudits[county].totalScore / countyAudits[county].count
          : 0,
    }))

    await redis.setex(cacheKey, 3600, JSON.stringify(breakdown))
    return breakdown
  }

  async getRouteAnalytics(routeId: string) {
    const cacheKey = `analytics:route:${routeId}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const { data: route } = await supabase
      .from('routes')
      .select('id, name, county, town_city, avg_score, last_audited')
      .eq('id', routeId)
      .maybeSingle()

    if (!route) throw new ApiError('Route not found', 404)

    // Get audit IDs for this route (all statuses — used for issue/rec counts)
    const { data: routeAudits } = await supabase
      .from('audits')
      .select('id')
      .eq('route_id', routeId)
      .is('deleted_at', null)

    const auditIds = (routeAudits || []).map((a: any) => a.id as string)

    const { count: auditCount } = await supabase
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', routeId)
      .eq('status', 'completed')
      .is('deleted_at', null)

    // Filter issues and recommendations to only those belonging to this route's audits
    let issueCount = 0
    let recCount = 0
    if (auditIds.length > 0) {
      const [issueResult, recResult] = await Promise.all([
        supabase
          .from('issues')
          .select('id', { count: 'exact', head: true })
          .in('audit_id', auditIds)
          .is('deleted_at', null),
        supabase
          .from('recommendations')
          .select('id', { count: 'exact', head: true })
          .in('audit_id', auditIds)
          .is('deleted_at', null),
      ])
      issueCount = issueResult.count || 0
      recCount = recResult.count || 0
    }

    const analytics = {
      route: { id: route.id, name: route.name, county: route.county, townCity: route.town_city },
      audits: { total: auditCount || 0, avgScore: route.avg_score || 0, lastAudited: route.last_audited },
      issues: issueCount || 0,
      recommendations: recCount || 0,
    }

    await redis.setex(cacheKey, 1800, JSON.stringify(analytics))
    return analytics
  }

  private async getAuditsByMonth(
    userId?: string,
    county?: string,
    startDate?: string,
    endDate?: string
  ) {
    let query = supabase
      .from('audits')
      .select('audit_date, normalized_score, route:routes(county)')
      .is('deleted_at', null)
      .eq('status', 'completed')
      .order('audit_date', { ascending: true })

    if (userId) query = query.eq('coordinator_id', userId)
    if (startDate) query = query.gte('audit_date', startDate)
    if (endDate) query = query.lte('audit_date', endDate)

    const { data: audits } = await query

    let filtered = (audits || []) as any[]
    if (county) {
      filtered = filtered.filter((a) => a.route?.county === county)
    }

    const byMonth: Record<string, { count: number; totalScore: number }> = {}
    filtered.forEach((audit) => {
      const month = new Date(audit.audit_date).toISOString().slice(0, 7)
      if (!byMonth[month]) byMonth[month] = { count: 0, totalScore: 0 }
      byMonth[month].count++
      if (audit.normalized_score) byMonth[month].totalScore += Number(audit.normalized_score)
    })

    return Object.entries(byMonth).map(([month, data]) => ({
      month,
      count: data.count,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0,
    }))
  }
}

export const analyticsService = new AnalyticsService()
