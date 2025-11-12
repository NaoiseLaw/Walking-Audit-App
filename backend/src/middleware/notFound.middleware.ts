import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    type: 'https://api.walkingaudit.ie/errors/not-found',
    title: 'Resource Not Found',
    status: 404,
    detail: `Cannot ${req.method} ${req.path}`,
    instance: req.path,
  });
}

