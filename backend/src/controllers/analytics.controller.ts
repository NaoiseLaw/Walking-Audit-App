import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { analyticsService } from '../services/analytics.service';

export async function getDashboardAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const county = req.query.county as string;
    const analytics = await analyticsService.getDashboardAnalytics(userId, county);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

export async function getAuditTrends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const county = req.query.county as string;
    const trends = await analyticsService.getAuditTrends(startDate, endDate, county);
    res.json(trends);
  } catch (error) {
    next(error);
  }
}

export async function getTopIssues(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const county = req.query.county as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const topIssues = await analyticsService.getTopIssues(county, limit);
    res.json(topIssues);
  } catch (error) {
    next(error);
  }
}

export async function getCountyBreakdown(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const breakdown = await analyticsService.getCountyBreakdown();
    res.json(breakdown);
  } catch (error) {
    next(error);
  }
}

export async function getRouteAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const analytics = await analyticsService.getRouteAnalytics(req.params.routeId);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

