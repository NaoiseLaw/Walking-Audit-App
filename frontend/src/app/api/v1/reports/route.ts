import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  try {
    const { searchParams } = req.nextUrl
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const where: any = { deletedAt: null, reportPdfUrl: { not: null } }

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        select: {
          id: true,
          reportPdfUrl: true,
          reportGeneratedAt: true,
          reportVersion: true,
          auditDate: true,
          route: { select: { id: true, name: true, townCity: true, county: true } },
          coordinator: { select: { id: true, name: true } },
        },
        orderBy: { reportGeneratedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.audit.count({ where }),
    ])

    return NextResponse.json({
      reports: audits,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch {
    return serverError()
  }
}
