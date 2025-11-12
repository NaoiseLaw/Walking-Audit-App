import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { recommendationService } from '../services/recommendation.service';

export async function createRecommendation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendation = await recommendationService.create(req.user.id, req.body);
    res.status(201).json(recommendation);
  } catch (error) {
    next(error);
  }
}

export async function getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      auditId: req.query.auditId as string,
      laStatus: req.query.laStatus as string,
      category: req.query.category as string,
      priority: req.query.priority ? parseInt(req.query.priority as string) : undefined,
      county: req.query.county as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await recommendationService.list(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRecommendationById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const recommendation = await recommendationService.getById(req.params.id);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
}

export async function updateRecommendation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendation = await recommendationService.update(req.params.id, req.user.id, req.body);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
}

export async function deleteRecommendation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await recommendationService.delete(req.params.id, req.user.id);
    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function respondToRecommendation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { response, status, rejectionReason } = req.body;
    const recommendation = await recommendationService.respond(req.params.id, req.user.id, response, status, rejectionReason);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
}

export async function implementRecommendation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notes, cost } = req.body;
    const recommendation = await recommendationService.implement(req.params.id, req.user.id, notes, cost);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
}

export async function verifyRecommendation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notes } = req.body;
    const recommendation = await recommendationService.verify(req.params.id, req.user.id, notes);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
}

