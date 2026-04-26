import { supabase, toCamel } from '@/lib/supabase-admin'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

interface CreateRouteData {
  name: string
  description?: string
  townCity: string
  county: string
  eircode?: string
  geometry?: string
  startPoint?: { lat: number; lng: number }
  endPoint?: { lat: number; lng: number }
  distanceMeters?: number
  avgGradientPercent?: number
  maxGradientPercent?: number
  minElevationMeters?: number
  maxElevationMeters?: number
  permeabilityScore?: number
  permeabilityNotes?: string
  hasPublicTransport?: boolean
  nearestBusStopMeters?: number
  nearestRailStationMeters?: number
  routeType?: string
  surfaceType?: string
  lighting?: string
  tags?: string[]
  isPublic?: boolean
  isFeatured?: boolean
}

interface UpdateRouteData {
  name?: string
  description?: string
  townCity?: string
  county?: string
  eircode?: string
  geometry?: string
  distanceMeters?: number
  avgGradientPercent?: number
  maxGradientPercent?: number
  minElevationMeters?: number
  maxElevationMeters?: number
  permeabilityScore?: number
  permeabilityNotes?: string
  hasPublicTransport?: boolean
  nearestBusStopMeters?: number
  nearestRailStationMeters?: number
  routeType?: string
  surfaceType?: string
  lighting?: string
  tags?: string[]
  isPublic?: boolean
  isFeatured?: boolean
}

export class RouteService {
  async create(userId: string, data: CreateRouteData) {
    // Build geometry from startPoint/endPoint if not provided directly
    let geometry = data.geometry || null
    if (!geometry && data.startPoint && data.endPoint) {
      geometry = JSON.stringify({
        type: 'LineString',
        coordinates: [
          [data.startPoint.lng, data.startPoint.lat],
          [data.endPoint.lng, data.endPoint.lat],
        ],
      })
    }

    const { data: route, error } = await supabase
      .from('routes')
      .insert({
        name: data.name,
        description: data.description,
        town_city: data.townCity,
        county: data.county,
        eircode: data.eircode,
        geometry,
        distance_meters: data.distanceMeters,
        avg_gradient_percent: data.avgGradientPercent,
        max_gradient_percent: data.maxGradientPercent,
        min_elevation_meters: data.minElevationMeters,
        max_elevation_meters: data.maxElevationMeters,
        permeability_score: data.permeabilityScore,
        permeability_notes: data.permeabilityNotes,
        has_public_transport: data.hasPublicTransport || false,
        nearest_bus_stop_meters: data.nearestBusStopMeters,
        nearest_rail_station_meters: data.nearestRailStationMeters,
        route_type: data.routeType,
        surface_type: data.surfaceType,
        lighting: data.lighting,
        tags: data.tags || [],
        is_public: data.isPublic !== undefined ? data.isPublic : true,
        is_featured: data.isFeatured || false,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      logger.error(`Route create error: ${JSON.stringify(error)}`)
      throw new ApiError('Failed to create route', 500)
    }

    await redis.del(`route:${route.id}`)
    logger.info(`Route created: ${route.id} by user ${userId}`)
    return toCamel(route)
  }

  async getById(routeId: string) {
    const cacheKey = `route:${routeId}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const { data: route } = await supabase
      .from('routes')
      .select('*, creator:users!created_by(id, name, organization)')
      .eq('id', routeId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!route) throw new ApiError('Route not found', 404)

    const { count: auditCount } = await supabase
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', routeId)
      .is('deleted_at', null)

    const result = toCamel({ ...route, _count: { audits: auditCount || 0 } })
    await redis.setex(cacheKey, 600, JSON.stringify(result))
    return result
  }

  async list(filters: {
    county?: string
    townCity?: string
    isPublic?: boolean
    isFeatured?: boolean
    search?: string
    limit?: number
    offset?: number
  }) {
    const { county, townCity, isPublic, isFeatured, search, limit = 20, offset = 0 } = filters

    let query = supabase
      .from('routes')
      .select('*, creator:users!created_by(id, name, organization)', { count: 'exact' })
      .is('deleted_at', null)

    if (county) query = query.eq('county', county)
    if (townCity) query = query.eq('town_city', townCity)
    if (isPublic !== undefined) query = query.eq('is_public', isPublic)
    if (isFeatured !== undefined) query = query.eq('is_featured', isFeatured)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,town_city.ilike.%${search}%`
      )
    }

    const { data: routes, count, error } = await query
      .order('is_featured', { ascending: false })
      .order('last_audited', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new ApiError('Failed to list routes', 500)

    const total = count || 0
    return {
      routes: toCamel(routes || []),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    }
  }

  async getNearby(params: { latitude: number; longitude: number; radiusMeters?: number; limit?: number }) {
    const { latitude, longitude, radiusMeters = 1000, limit = 10 } = params

    // PostGIS query via Supabase RPC — requires get_nearby_routes function in DB
    const { data, error } = await supabase.rpc('get_nearby_routes', {
      lat: latitude,
      lng: longitude,
      radius_meters: radiusMeters,
      max_results: limit,
    })

    if (error) {
      // Fallback: return public routes without distance filtering
      logger.warn('getNearby RPC failed, falling back to list:', error.message)
      const { data: fallback } = await supabase
        .from('routes')
        .select('*')
        .is('deleted_at', null)
        .eq('is_public', true)
        .limit(limit)
      return toCamel(fallback || [])
    }

    return toCamel(data || [])
  }

  async update(routeId: string, userId: string, data: UpdateRouteData) {
    const { data: route } = await supabase
      .from('routes')
      .select('created_by')
      .eq('id', routeId)
      .maybeSingle()
    if (!route) throw new ApiError('Route not found', 404)

    if (route.created_by !== userId) {
      const { data: user } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    const updatePayload: any = {}
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.townCity !== undefined) updatePayload.town_city = data.townCity
    if (data.county !== undefined) updatePayload.county = data.county
    if (data.eircode !== undefined) updatePayload.eircode = data.eircode
    if (data.geometry !== undefined) updatePayload.geometry = data.geometry
    if (data.distanceMeters !== undefined) updatePayload.distance_meters = data.distanceMeters
    if (data.avgGradientPercent !== undefined) updatePayload.avg_gradient_percent = data.avgGradientPercent
    if (data.maxGradientPercent !== undefined) updatePayload.max_gradient_percent = data.maxGradientPercent
    if (data.minElevationMeters !== undefined) updatePayload.min_elevation_meters = data.minElevationMeters
    if (data.maxElevationMeters !== undefined) updatePayload.max_elevation_meters = data.maxElevationMeters
    if (data.permeabilityScore !== undefined) updatePayload.permeability_score = data.permeabilityScore
    if (data.permeabilityNotes !== undefined) updatePayload.permeability_notes = data.permeabilityNotes
    if (data.hasPublicTransport !== undefined) updatePayload.has_public_transport = data.hasPublicTransport
    if (data.nearestBusStopMeters !== undefined) updatePayload.nearest_bus_stop_meters = data.nearestBusStopMeters
    if (data.nearestRailStationMeters !== undefined) updatePayload.nearest_rail_station_meters = data.nearestRailStationMeters
    if (data.routeType !== undefined) updatePayload.route_type = data.routeType
    if (data.surfaceType !== undefined) updatePayload.surface_type = data.surfaceType
    if (data.lighting !== undefined) updatePayload.lighting = data.lighting
    if (data.tags !== undefined) updatePayload.tags = data.tags
    if (data.isPublic !== undefined) updatePayload.is_public = data.isPublic
    if (data.isFeatured !== undefined) updatePayload.is_featured = data.isFeatured

    const { data: updatedRoute, error } = await supabase
      .from('routes')
      .update(updatePayload)
      .eq('id', routeId)
      .select()
      .single()

    if (error) throw new ApiError('Failed to update route', 500)

    await redis.del(`route:${routeId}`)
    logger.info(`Route updated: ${routeId} by user ${userId}`)
    return toCamel(updatedRoute)
  }

  async delete(routeId: string, userId: string) {
    const { data: route } = await supabase
      .from('routes')
      .select('created_by')
      .eq('id', routeId)
      .maybeSingle()
    if (!route) throw new ApiError('Route not found', 404)

    const { data: user } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
    if (
      route.created_by !== userId &&
      user?.role !== 'system_admin' &&
      user?.role !== 'la_admin'
    ) {
      throw new ApiError('Insufficient permissions', 403)
    }

    await supabase.from('routes').update({ deleted_at: new Date().toISOString() }).eq('id', routeId)
    await redis.del(`route:${routeId}`)
    logger.info(`Route deleted: ${routeId} by user ${userId}`)
  }
}

export const routeService = new RouteService()
