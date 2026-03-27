import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/services/auth.service'
import { ApiError } from '@/lib/api-error'
import { badRequest } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.email) return badRequest('email is required')

    const result = await authService.resendVerification(body.email)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
