import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/lib/services/recommendation.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const result = await recommendationService.list({
      auditId: searchParams.get('auditId') || undefined,
      laStatus: searchParams.get('laStatus') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') ? parseInt(searchParams.get('priority')!) : undefined,
      county: searchParams.get('county') || undefined,
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

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const recommendation = await recommendationService.create(user.id, body)
    return NextResponse.json(recommendation, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}
