import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/lib/services/analytics.service'
import { getAuthUser, unauthorized } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const county = searchParams.get('county') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const result = await analyticsService.getTopIssues(county, limit)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[api] Unexpected error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 })
  }
}
