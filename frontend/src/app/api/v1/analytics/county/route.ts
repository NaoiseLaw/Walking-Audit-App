import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/services/analytics.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const result = await analyticsService.getCountyBreakdown()
    return NextResponse.json(result)
  } catch {
    return serverError()
  }
}
