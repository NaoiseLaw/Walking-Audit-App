import { NextRequest, NextResponse } from 'next/server'
import { issueService } from '@/lib/services/issue.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const result = await issueService.list({
      auditId: searchParams.get('auditId') || undefined,
      section: searchParams.get('section') || undefined,
      category: searchParams.get('category') || undefined,
      severity: searchParams.get('severity') || undefined,
      laStatus: searchParams.get('laStatus') || undefined,
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
    const issue = await issueService.create(user.id, body)
    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}
