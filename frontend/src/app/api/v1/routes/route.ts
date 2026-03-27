import { NextRequest, NextResponse } from 'next/server'
import { routeService } from '@/lib/services/walkingRoute.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const result = await routeService.list({
      county: searchParams.get('county') || undefined,
      townCity: searchParams.get('townCity') || undefined,
      search: searchParams.get('search') || undefined,
      isPublic: searchParams.has('isPublic') ? searchParams.get('isPublic') === 'true' : undefined,
      isFeatured: searchParams.has('isFeatured') ? searchParams.get('isFeatured') === 'true' : undefined,
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
    const route = await routeService.create(user.id, body)
    return NextResponse.json(route, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}
