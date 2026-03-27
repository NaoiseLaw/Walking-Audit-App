import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from './supabase-admin'

export interface AuthUser {
  id: string
  email: string
  role: string
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string
      email: string
      role: string
    }
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.userId)
      .is('deleted_at', null)
      .maybeSingle()

    return user ? { id: user.id, email: user.email, role: user.role } : null
  } catch {
    return null
  }
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 })
}
