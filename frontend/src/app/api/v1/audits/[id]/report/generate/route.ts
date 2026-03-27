import { NextRequest, NextResponse } from 'next/server'
import { reportService } from '@/lib/services/report.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'
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
    return serverError()
  }
}
