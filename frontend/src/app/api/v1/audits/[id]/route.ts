import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/lib/services/audit.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const audit = await auditService.getById(params.id, user.id)
    return NextResponse.json(audit)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const audit = await auditService.update(params.id, user.id, body)
    return NextResponse.json(audit)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    await auditService.delete(params.id, user.id)
    return NextResponse.json({ message: 'Audit deleted' })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}
