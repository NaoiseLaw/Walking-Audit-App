import { supabase, toCamel } from '@/lib/supabase-admin'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

const PHOTO_BUCKET = 'audit-photos'

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
  async getUploadUrl(userId: string, data: GetUploadUrlData) {
    const { data: audit } = await supabase
      .from('audits')
      .select('id')
      .eq('id', data.auditId)
      .maybeSingle()
    if (!audit) throw new ApiError('Audit not found', 404)

    const storagePath = `audits/${data.auditId}/photos/${Date.now()}-${data.filename}`

    const { data: signed, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !signed) throw new ApiError('Failed to create upload URL', 500)

    const { data: { publicUrl } } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(storagePath)

    return { uploadUrl: signed.signedUrl, storagePath, publicUrl }
  }

  async confirmUpload(userId: string, data: ConfirmUploadData) {
    const { data: audit } = await supabase
      .from('audits')
      .select('id')
      .eq('id', data.auditId)
      .maybeSingle()
    if (!audit) throw new ApiError('Audit not found', 404)

    let photoLocation: string | null = null
    let locationAccuracy: number | null = null

    if (data.location) {
      photoLocation = `POINT(${data.location.longitude} ${data.location.latitude})`
      locationAccuracy = data.location.accuracy || null
    }

    const { data: photo, error } = await supabase
      .from('photos')
      .insert({
        audit_id: data.auditId,
        issue_id: data.issueId || null,
        url: data.publicUrl,
        filename: data.filename,
        original_filename: data.filename,
        file_size_kb: data.fileSizeKb,
        mime_type: data.mimeType,
        width_px: data.widthPx,
        height_px: data.heightPx,
        location: photoLocation,
        location_accuracy_meters: locationAccuracy,
        location_source: data.location ? 'user' : null,
        exif_data: data.exifData || {},
        processed: false,
        compression_applied: false,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (error) throw new ApiError('Failed to save photo', 500)

    await redis.del(`audit:${data.auditId}:photos`)
    logger.info(`Photo confirmed: ${photo.id} by user ${userId}`)
    return toCamel(photo)
  }

  async getById(photoId: string) {
    const { data: photo } = await supabase
      .from('photos')
      .select(`
        *,
        audit:audits(id, route_id),
        issue:issues(id, title),
        uploader:users!uploaded_by(id, name)
      `)
      .eq('id', photoId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!photo) throw new ApiError('Photo not found', 404)
    return toCamel(photo)
  }

  async list(filters: {
    auditId?: string
    issueId?: string
    userId?: string
    limit?: number
    offset?: number
  }) {
    const { auditId, issueId, userId, limit = 50, offset = 0 } = filters

    let query = supabase
      .from('photos')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (auditId) query = query.eq('audit_id', auditId)
    if (issueId) query = query.eq('issue_id', issueId)
    if (userId) query = query.eq('uploaded_by', userId)

    const { data: photos, count, error } = await query
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new ApiError('Failed to list photos', 500)

    const total = count || 0
    return {
      photos: toCamel(photos || []),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    }
  }

  async delete(photoId: string, userId: string) {
    const { data: photo } = await supabase
      .from('photos')
      .select('id, uploaded_by, audit_id, url')
      .eq('id', photoId)
      .maybeSingle()
    if (!photo) throw new ApiError('Photo not found', 404)

    if (photo.uploaded_by !== userId) {
      const { data: user } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
      if (user?.role !== 'system_admin' && user?.role !== 'la_admin') {
        throw new ApiError('Insufficient permissions', 403)
      }
    }

    try {
      if (photo.url) {
        const urlParts = photo.url.split(`/storage/v1/object/public/${PHOTO_BUCKET}/`)
        const storagePath = urlParts[1] ? decodeURIComponent(urlParts[1]) : null
        if (storagePath) await supabase.storage.from(PHOTO_BUCKET).remove([storagePath])
      }
    } catch (error) {
      logger.error(`Failed to delete photo from storage: ${error}`)
    }

    await supabase.from('photos').update({ deleted_at: new Date().toISOString() }).eq('id', photoId)
    await redis.del(`audit:${photo.audit_id}:photos`)
    logger.info(`Photo deleted: ${photoId} by user ${userId}`)
  }
}

export const photoService = new PhotoService()
