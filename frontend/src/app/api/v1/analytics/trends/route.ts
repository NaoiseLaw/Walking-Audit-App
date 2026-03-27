import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/services/analytics.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const result = await analyticsService.getAuditTrends(
      searchParams.get('startDate') || undefined,
      searchParams.get('endDate') || undefined,
      searchParams.get('county') || undefined
    )
    return NextResponse.json(result)
  } catch {
    return serverError()
  }
}
