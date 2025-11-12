import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { photoService } from '../services/photo.service';

export async function uploadPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { auditId, issueId, location, exifData } = req.body;

    const photo = await photoService.upload(req.user.id, {
      auditId,
      issueId,
      file: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      location: location ? JSON.parse(location) : undefined,
      exifData: exifData ? JSON.parse(exifData) : undefined,
    });

    res.status(201).json(photo);
  } catch (error) {
    next(error);
  }
}

export async function getPhotos(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filters = {
      auditId: req.query.auditId as string,
      issueId: req.query.issueId as string,
      userId: req.query.userId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await photoService.list(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPhotoById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const photo = await photoService.getById(req.params.id);
    res.json(photo);
  } catch (error) {
    next(error);
  }
}

export async function deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await photoService.delete(req.params.id, req.user.id);
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    next(error);
  }
}

