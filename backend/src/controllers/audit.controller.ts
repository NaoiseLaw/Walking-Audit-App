import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { auditService } from '../services/audit.service';
import { reportService } from '../services/report.service';

export async function createAudit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const audit = await auditService.create(req.user.id, req.body);
    res.status(201).json(audit);
  } catch (error) {
    next(error);
  }
}

export async function getAudits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      userId: req.query.userId as string,
      routeId: req.query.routeId as string,
      status: req.query.status as string,
      county: req.query.county as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await auditService.list(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAuditById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const audit = await auditService.getById(req.params.id, req.user.id);
    res.json(audit);
  } catch (error) {
    next(error);
  }
}

export async function updateAudit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const audit = await auditService.update(req.params.id, req.user.id, req.body);
    res.json(audit);
  } catch (error) {
    next(error);
  }
}

export async function deleteAudit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await auditService.delete(req.params.id, req.user.id);
    res.json({ message: 'Audit deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getAuditReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.getReportUrl(req.params.id);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function generateAuditReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.generateReport(req.params.id);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

