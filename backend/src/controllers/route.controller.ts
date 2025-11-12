import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { routeService } from '../services/route.service';

export async function createRoute(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const route = await routeService.create(req.user.id, req.body);
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
}

export async function getRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      county: req.query.county as string,
      townCity: req.query.townCity as string,
      isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
      isFeatured: req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await routeService.list(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRouteById(req: Request, res: Response, next: NextFunction) {
  try {
    const route = await routeService.getById(req.params.id);
    res.json(route);
  } catch (error) {
    next(error);
  }
}

export async function updateRoute(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const route = await routeService.update(req.params.id, req.user.id, req.body);
    res.json(route);
  } catch (error) {
    next(error);
  }
}

export async function deleteRoute(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await routeService.delete(req.params.id, req.user.id);
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getNearbyRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radiusMeters = req.query.radius ? parseInt(req.query.radius as string) : 1000;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const routes = await routeService.getNearby({ latitude, longitude, radiusMeters, limit });
    res.json({ routes });
  } catch (error) {
    next(error);
  }
}

