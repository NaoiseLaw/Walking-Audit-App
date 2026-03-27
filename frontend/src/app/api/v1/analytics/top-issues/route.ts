import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/services/analytics.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const county = searchParams.get('county') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const result = await analyticsService.getTopIssues(county, limit)
    return NextResponse.json(result)
  } catch {
    return serverError()
  }
}
