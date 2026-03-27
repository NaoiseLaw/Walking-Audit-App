import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/services/auth.service'
import { ApiError } from '@/lib/api-error'
import { badRequest } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role, organization, county } = body

    if (!email || !password || !name) {
      return badRequest('email, password, and name are required')
    }

    const user = await authService.register({ email, password, name, role, organization, county })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
