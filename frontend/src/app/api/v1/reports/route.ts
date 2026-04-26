import { NextRequest, NextResponse } from 'next/server'
import { supabase, toCamel } from '@/lib/supabase-admin'
import { getAuthUser, unauthorized } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const { data: audits, count } = await supabase
      .from('audits')
      .select(
        'id, report_pdf_url, report_generated_at, report_version, audit_date, route:routes(id, name, town_city, county), coordinator:users!coordinator_id(id, name)',
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .not('report_pdf_url', 'is', null)
      .order('report_generated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const total = count || 0
    return NextResponse.json({
      reports: toCamel(audits || []),
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch {
    console.error('[api] Unexpected error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 })
  }
}
