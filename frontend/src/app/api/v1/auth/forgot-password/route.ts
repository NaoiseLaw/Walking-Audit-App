import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/services/auth.service'
import { badRequest } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.email) return badRequest('email is required')

    const result = await authService.forgotPassword(body.email)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
