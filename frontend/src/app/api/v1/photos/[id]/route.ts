import { NextRequest, NextResponse } from 'next/server'
import { photoService } from '@/lib/services/photo.service'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'
import { ApiError } from '@/lib/api-error'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const photo = await photoService.getById(params.id)
    return NextResponse.json(photo)
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
    await photoService.delete(params.id, user.id)
    return NextResponse.json({ message: 'Photo deleted' })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return serverError()
  }
}
