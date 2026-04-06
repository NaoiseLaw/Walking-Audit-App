import { NextRequest, NextResponse } from 'next/server'
import { photoService } from '@/lib/services/photo.service'
import { getAuthUser, unauthorized, badRequest, serverError } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

// Call this after the browser has finished uploading to Supabase Storage.
// Saves photo metadata to the database.
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { auditId, publicUrl, filename, mimeType } = body

    if (!auditId || !publicUrl || !filename || !mimeType) {
      return badRequest('auditId, publicUrl, filename, and mimeType are required')
    }

    const photo = await photoService.confirmUpload(user.id, body)
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}
