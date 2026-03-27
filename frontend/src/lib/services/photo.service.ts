import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'
import * as admin from 'firebase-admin'

function getFirebaseBucket() {
  if (!process.env.FIREBASE_STORAGE_BUCKET) return null

  if (!admin.apps.length) {
    try {
      const credential = process.env.FIREBASE_SERVICE_ACCOUNT
        ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        : admin.credential.applicationDefault()

      admin.initializeApp({
        credential,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      })
    } catch (error) {
      logger.warn('Firebase Admin not initialised. Photo uploads will fail.')
      return null
    }
  }

  try {
    return admin.storage().bucket()
  } catch {
    return null
  }
}

interface GetUploadUrlData {
  auditId: string
  issueId?: string
  filename: string
  mimeType: string
}

interface ConfirmUploadData {
  auditId: string
  issueId?: string
  storagePath: string
  publicUrl: string
  filename: string
  mimeType: string
  fileSizeKb?: number
  widthPx?: number
  heightPx?: number
  location?: { latitude: number; longitude: number; accuracy?: number }
  exifData?: Record<string, any>
}

export class PhotoService {
  /**
   * Generate a signed URL for direct browser upload to Firebase Storage.
   * The browser uploads the file directly; no data passes through Next.js.
   */
  async getUploadUrl(userId: string, data: GetUploadUrlData) {
    const audit = await prisma.audit.findUnique({ where: { id: data.auditId } })
    if (!audit) throw new ApiError('Audit not found', 404)

    const bucket = getFirebaseBucket()
    if (!bucket) throw new ApiError('Firebase Storage not configured', 503)

    const storagePath = `audits/${data.auditId}/photos/${Date.now()}-${data.filename}`
    const file = bucket.file(storagePath)

    const [signedUrl] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: data.mimeType,
    })

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

    return { uploadUrl: signedUrl, storagePath, publicUrl }
  }

  /**
   * Save photo metadata after the browser has uploaded the file directly to Firebase.
   */
  async confirmUpload(userId: string, data: ConfirmUploadData) {
    const audit = await prisma.audit.findUnique({ where: { id: data.auditId } })
    if (!audit) throw new ApiError('Audit not found', 404)

    let photoLocation: string | null = null
    let locationAccuracy: number | null = null

    if (data.location) {
      photoLocation = `POINT(${data.location.longitude} ${data.location.latitude})`
      locationAccuracy = data.location.accuracy || null
    }

    const photo = await prisma.photo.create({
      data: {
        auditId: data.auditId,
        issueId: data.issueId || null,
        url: data.publicUrl,
        filename: data.filename,
        originalFilename: data.filename,
        fileSizeKb: data.fileSizeKb,
        mimeType: data.mimeType,
        widthPx: data.widthPx,
        heightPx: data.heightPx,
        location: photoLocation,
        locationAccuracyMeters: locationAccuracy,
        locationSource: data.location ? 'user' : null,
        exifData: data.exifData || {},
        processed: false,
        compressionApplied: false,
        uploadedBy: userId,
      },
    })

    await redis.del(`audit:${data.auditId}:photos`)
    logger.info(`Photo confirmed: ${photo.id} by user ${userId}`)
    return photo
  }

  async getById(photoId: string) {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId, deletedAt: null },
      include: {
        audit: { select: { id: true, routeId: true } },
        issue: { select: { id: true, title: true } },
        uploader: { select: { id: true, name: true } },
      },
    })

    if (!photo) throw new ApiError('Photo not found', 404)
    return photo
  }

  async list(filters: {
    auditId?: string
    issueId?: string
    userId?: string
    limit?: number
    offset?: number
  }) {
    const { auditId, issueId, userId, limit = 50, offset = 0 } = filters

    const where: any = { deletedAt: null }
    if (auditId) where.auditId = auditId
    if (issueId) where.issueId = issueId
    if (userId) where.uploadedBy = userId

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.photo.count({ where }),
    ])

    return { photos, pagination: { total, limit, offset, hasMore: offset + limit < total } }
  }

  async delete(photoId: string, userId: string) {
    const photo = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!photo) throw new ApiError('Photo not found', 404)

    if (photo.uploadedBy !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    // Attempt to delete from Firebase Storage
    try {
      const bucket = getFirebaseBucket()
      if (bucket && photo.url) {
        const path = photo.url.split(`${bucket.name}/`)[1]
        if (path) await bucket.file(decodeURIComponent(path)).delete()
      }
    } catch (error) {
      logger.error(`Failed to delete photo from storage: ${error}`)
    }

    await prisma.photo.update({ where: { id: photoId }, data: { deletedAt: new Date() } })
    await redis.del(`audit:${photo.auditId}:photos`)
    logger.info(`Photo deleted: ${photoId} by user ${userId}`)
  }
}

export const photoService = new PhotoService()
