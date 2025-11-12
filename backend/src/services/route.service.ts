import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';

interface CreateRouteData {
  name: string;
  description?: string;
  townCity: string;
  county: string;
  eircode?: string;
  geometry: string; // WKT LineString
  distanceMeters?: number;
  avgGradientPercent?: number;
  maxGradientPercent?: number;
  minElevationMeters?: number;
  maxElevationMeters?: number;
  permeabilityScore?: number;
  permeabilityNotes?: string;
  hasPublicTransport?: boolean;
  nearestBusStopMeters?: number;
  nearestRailStationMeters?: number;
  routeType?: string;
  surfaceType?: string;
  lighting?: string;
  tags?: string[];
  isPublic?: boolean;
  isFeatured?: boolean;
}

interface UpdateRouteData {
  name?: string;
  description?: string;
  townCity?: string;
  county?: string;
  eircode?: string;
  geometry?: string;
  distanceMeters?: number;
  avgGradientPercent?: number;
  maxGradientPercent?: number;
  minElevationMeters?: number;
  maxElevationMeters?: number;
  permeabilityScore?: number;
  permeabilityNotes?: string;
  hasPublicTransport?: boolean;
  nearestBusStopMeters?: number;
  nearestRailStationMeters?: number;
  routeType?: string;
  surfaceType?: string;
  lighting?: string;
  tags?: string[];
  isPublic?: boolean;
  isFeatured?: boolean;
}

interface NearbyRoutesParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  limit?: number;
}

export class RouteService {
  /**
   * Create a new route
   */
  async create(userId: string, data: CreateRouteData) {
    // Validate geometry (should be a valid PostGIS LineString)
    // In production, you'd want more robust validation

    // Calculate bounding box and center point from geometry
    // This would typically be done with PostGIS functions
    // For now, we'll store the geometry as-is

    const route = await prisma.route.create({
      data: {
        name: data.name,
        description: data.description,
        townCity: data.townCity,
        county: data.county,
        eircode: data.eircode,
        geometry: data.geometry,
        distanceMeters: data.distanceMeters,
        avgGradientPercent: data.avgGradientPercent,
        maxGradientPercent: data.maxGradientPercent,
        minElevationMeters: data.minElevationMeters,
        maxElevationMeters: data.maxElevationMeters,
        permeabilityScore: data.permeabilityScore,
        permeabilityNotes: data.permeabilityNotes,
        hasPublicTransport: data.hasPublicTransport || false,
        nearestBusStopMeters: data.nearestBusStopMeters,
        nearestRailStationMeters: data.nearestRailStationMeters,
        routeType: data.routeType,
        surfaceType: data.surfaceType,
        lighting: data.lighting,
        tags: data.tags || [],
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        isFeatured: data.isFeatured || false,
        createdBy: userId,
      },
    });

    // Invalidate cache
    await redis.del(`route:${route.id}`);
    await redis.del('routes:list:*');

    logger.info(`Route created: ${route.id} by user ${userId}`);

    return route;
  }

  /**
   * Get route by ID
   */
  async getById(routeId: string) {
    // Check cache
    const cacheKey = `route:${routeId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const route = await prisma.route.findUnique({
      where: {
        id: routeId,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
        _count: {
          select: {
            audits: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!route) {
      throw new ApiError('Route not found', 404);
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(route));

    return route;
  }

  /**
   * List routes with filters
   */
  async list(filters: {
    county?: string;
    townCity?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      county,
      townCity,
      isPublic,
      isFeatured,
      search,
      limit = 20,
      offset = 0,
    } = filters;

    const where: any = {
      deletedAt: null,
    };

    if (county) {
      where.county = county;
    }

    if (townCity) {
      where.townCity = townCity;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { townCity: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              organization: true,
            },
          },
          _count: {
            select: {
              audits: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { lastAudited: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.route.count({ where }),
    ]);

    return {
      routes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get nearby routes using PostGIS
   */
  async getNearby(params: NearbyRoutesParams) {
    const { latitude, longitude, radiusMeters = 1000, limit = 10 } = params;

    // Use raw SQL for PostGIS spatial query
    // This finds routes whose geometry is within the specified radius
    const routes = await prisma.$queryRaw<any[]>`
      SELECT 
        r.*,
        ST_Distance(
          ST_Transform(ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 3857),
          ST_Transform(ST_GeomFromText(r.geometry, 4326), 3857)
        ) AS distance_meters
      FROM routes r
      WHERE r.deleted_at IS NULL
        AND r.is_public = true
        AND ST_DWithin(
          ST_Transform(ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 3857),
          ST_Transform(ST_GeomFromText(r.geometry, 4326), 3857),
          ${radiusMeters}
        )
      ORDER BY distance_meters
      LIMIT ${limit}
    `;

    return routes;
  }

  /**
   * Update route
   */
  async update(routeId: string, userId: string, data: UpdateRouteData) {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw new ApiError('Route not found', 404);
    }

    // Check permissions
    if (route.createdBy !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403);
      }
    }

    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        name: data.name,
        description: data.description,
        townCity: data.townCity,
        county: data.county,
        eircode: data.eircode,
        geometry: data.geometry,
        distanceMeters: data.distanceMeters,
        avgGradientPercent: data.avgGradientPercent,
        maxGradientPercent: data.maxGradientPercent,
        minElevationMeters: data.minElevationMeters,
        maxElevationMeters: data.maxElevationMeters,
        permeabilityScore: data.permeabilityScore,
        permeabilityNotes: data.permeabilityNotes,
        hasPublicTransport: data.hasPublicTransport,
        nearestBusStopMeters: data.nearestBusStopMeters,
        nearestRailStationMeters: data.nearestRailStationMeters,
        routeType: data.routeType,
        surfaceType: data.surfaceType,
        lighting: data.lighting,
        tags: data.tags,
        isPublic: data.isPublic,
        isFeatured: data.isFeatured,
      },
    });

    // Invalidate cache
    await redis.del(`route:${routeId}`);
    await redis.del('routes:list:*');

    logger.info(`Route updated: ${routeId} by user ${userId}`);

    return updatedRoute;
  }

  /**
   * Delete route (soft delete)
   */
  async delete(routeId: string, userId: string) {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw new ApiError('Route not found', 404);
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      route.createdBy !== userId &&
      user?.role !== 'system_admin' &&
      user?.role !== 'la_admin'
    ) {
      throw new ApiError('Insufficient permissions', 403);
    }

    // Soft delete
    await prisma.route.update({
      where: { id: routeId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidate cache
    await redis.del(`route:${routeId}`);
    await redis.del('routes:list:*');

    logger.info(`Route deleted: ${routeId} by user ${userId}`);
  }
}

export const routeService = new RouteService();

