import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { reportService } from '../services/report.service';

export async function generateReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.generateReport(req.body.auditId || req.params.id);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function getReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.getReportUrl(req.params.id);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function downloadReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.getReportUrl(req.params.id);
    // Redirect to report URL or return it
    res.json(report);
  } catch (error) {
    next(error);
  }
}

