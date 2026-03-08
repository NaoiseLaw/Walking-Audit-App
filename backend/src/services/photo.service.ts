import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';
import sharp from 'sharp';
import * as admin from 'firebase-admin';

function getFirebaseBucket() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(
          process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json')
        ),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      logger.warn('Firebase Admin not initialized. Photo uploads will fail.');
      return null;
    }
  }
  return admin.storage().bucket();
}

interface UploadPhotoData {
  auditId: string;
  issueId?: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  exifData?: Record<string, any>;
}

export class PhotoService {

  /**
   * Upload and process photo
   */
  async upload(userId: string, data: UploadPhotoData) {
    const { auditId, issueId, file, filename, mimeType, location, exifData } = data;

    // Verify audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    // Process image
    const processed = await this.processImage(file);
    const thumbnail = await this.generateThumbnail(file);

    // Upload to Firebase Storage
    const photoUrl = await this.uploadToStorage(
      processed.buffer,
      `audits/${auditId}/photos/${Date.now()}-${filename}`
    );
    const thumbnailUrl = await this.uploadToStorage(
      thumbnail,
      `audits/${auditId}/thumbnails/${Date.now()}-thumb-${filename}`
    );

    // Extract location from EXIF if not provided
    let photoLocation: string | null = null;
    let locationAccuracy: number | null = null;

    if (location) {
      photoLocation = `POINT(${location.longitude} ${location.latitude})`;
      locationAccuracy = location.accuracy || null;
    } else if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
      photoLocation = `POINT(${exifData.GPSLongitude} ${exifData.GPSLatitude})`;
    }

    // Extract EXIF metadata
    const metadata = {
      cameraMake: exifData?.Make || null,
      cameraModel: exifData?.Model || null,
      takenAt: exifData?.DateTimeOriginal
        ? new Date(exifData.DateTimeOriginal)
        : null,
      focalLength: exifData?.FocalLength || null,
      aperture: exifData?.FNumber || null,
      iso: exifData?.ISO || null,
    };

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        auditId,
        issueId: issueId || null,
        url: photoUrl,
        thumbnailUrl,
        filename,
        originalFilename: filename,
        fileSizeKb: Math.round(processed.length / 1024),
        mimeType: 'image/jpeg',
        widthPx: processed.width,
        heightPx: processed.height,
        location: photoLocation,
        locationAccuracyMeters: locationAccuracy,
        locationSource: location ? 'user' : 'exif',
        takenAt: metadata.takenAt,
        cameraMake: metadata.cameraMake,
        cameraModel: metadata.cameraModel,
        focalLengthMm: metadata.focalLength,
        aperture: metadata.aperture?.toString(),
        iso: metadata.iso,
        exifData: exifData || {},
        processed: true,
        compressionApplied: true,
        uploadedBy: userId,
      },
    });

    // Invalidate cache
    await redis.del(`audit:${auditId}:photos`);

    logger.info(`Photo uploaded: ${photo.id} by user ${userId}`);

    return photo;
  }

  /**
   * Get photo by ID
   */
  async getById(photoId: string) {
    const photo = await prisma.photo.findUnique({
      where: {
        id: photoId,
        deletedAt: null,
      },
      include: {
        audit: {
          select: {
            id: true,
            routeId: true,
          },
        },
        issue: {
          select: {
            id: true,
            title: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!photo) {
      throw new ApiError('Photo not found', 404);
    }

    return photo;
  }

  /**
   * List photos
   */
  async list(filters: {
    auditId?: string;
    issueId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { auditId, issueId, userId, limit = 50, offset = 0 } = filters;

    const where: any = {
      deletedAt: null,
    };

    if (auditId) {
      where.auditId = auditId;
    }

    if (issueId) {
      where.issueId = issueId;
    }

    if (userId) {
      where.uploadedBy = userId;
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: {
          uploadedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.photo.count({ where }),
    ]);

    return {
      photos,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Delete photo
   */
  async delete(photoId: string, userId: string) {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new ApiError('Photo not found', 404);
    }

    // Check permissions
    if (photo.uploadedBy !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403);
      }
    }

    // Delete from storage
    try {
      await this.deleteFromStorage(photo.url);
      if (photo.thumbnailUrl) {
        await this.deleteFromStorage(photo.thumbnailUrl);
      }
    } catch (error) {
      logger.error(`Failed to delete photo from storage: ${error}`);
    }

    // Soft delete
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidate cache
    await redis.del(`audit:${photo.auditId}:photos`);

    logger.info(`Photo deleted: ${photoId} by user ${userId}`);
  }

  /**
   * Process image (compress, resize)
   */
  private async processImage(buffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number; length: number }> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if too large (max 2048px on longest side)
    const maxDimension = 2048;
    let width = metadata.width || 0;
    let height = metadata.height || 0;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        width = maxDimension;
        height = Math.round((metadata.height || 0) * (maxDimension / (metadata.width || 1)));
      } else {
        height = maxDimension;
        width = Math.round((metadata.width || 0) * (maxDimension / (metadata.height || 1)));
      }
    }

    const processed = await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    return {
      buffer: processed,
      width,
      height,
      length: processed.length,
    };
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Upload to Firebase Storage
   */
  private async uploadToStorage(buffer: Buffer, path: string): Promise<string> {
    const bucket = getFirebaseBucket();
    if (!bucket) throw new ApiError('Firebase Storage not configured', 503);
    const file = bucket.file(path);
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
      public: true,
    });

    return file.publicUrl();
  }

  /**
   * Delete from Firebase Storage
   */
  private async deleteFromStorage(url: string): Promise<void> {
    const bucket = getFirebaseBucket();
    if (!bucket) return;
    const path = url.split('/o/')[1]?.split('?')[0];
    if (path) {
      const file = bucket.file(decodeURIComponent(path));
      await file.delete();
    }
  }
}

export const photoService = new PhotoService();

