import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  id?: string;
}

export function requestLogger(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID
  req.id = uuidv4();
  
  // Set request ID in response header
  res.setHeader('X-Request-ID', req.id);
  
  // Log request
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    if (res.statusCode >= 400) {
      console.error('Request failed:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
}

