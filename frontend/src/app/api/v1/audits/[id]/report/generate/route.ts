import { NextRequest, NextResponse } from 'next/server'
import { reportService } from '@/lib/services/report.service'
import { getAuthUser, unauthorized } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const result = await reportService.generateReport(params.id)
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
