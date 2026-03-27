import { NextRequest, NextResponse } from 'next/server'
import { photoService } from '@/lib/services/photo.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const result = await photoService.list({
      auditId: searchParams.get('auditId') || undefined,
      issueId: searchParams.get('issueId') || undefined,
      userId: searchParams.get('userId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}
