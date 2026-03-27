import { NextResponse } from 'next/server'

// JWT is stateless — logout is handled client-side by discarding tokens.
export async function POST() {
  return NextResponse.json({ message: 'Logged out successfully' })
}
