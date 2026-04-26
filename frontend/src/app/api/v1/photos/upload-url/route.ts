import { NextRequest, NextResponse } from 'next/server'
import { photoService } from '@/lib/services/photo.service'
import { getAuthUser, unauthorized, badRequest } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

// Returns a signed URL for direct browser-to-Supabase upload.
// The browser uploads the file directly to Supabase Storage — nothing passes through Next.js.
// After upload, call POST /api/v1/photos/confirm to save the metadata.
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { auditId, issueId, filename, mimeType } = body

    if (!auditId || !filename || !mimeType) {
      return badRequest('auditId, filename, and mimeType are required')
    }

    const result = await photoService.getUploadUrl(user.id, { auditId, issueId, filename, mimeType })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('[api] Unexpected error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 })
  }
}
