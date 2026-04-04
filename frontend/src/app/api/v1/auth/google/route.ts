import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { authService } from '@/lib/services/auth.service'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json()

    if (!credential) {
      return NextResponse.json({ message: 'Missing credential' }, { status: 400 })
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ message: 'Google OAuth not configured' }, { status: 503 })
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.sub || !payload?.email) {
      return NextResponse.json({ message: 'Invalid Google token' }, { status: 401 })
    }

    const result = await authService.loginWithGoogle({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0],
      avatarUrl: payload.picture,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Google authentication failed' },
      { status: err.statusCode || 500 }
    )
  }
}
