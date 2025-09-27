import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const productId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '7', 10), 50))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    // Fetch next page of reviews (newest first)
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    const total = await prisma.review.count({ where: { productId } })
    const nextOffset = offset + reviews.length
    const hasMore = nextOffset < total

    // Serialize date fields for client
    const serialized = reviews.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: serialized,
      pagination: {
        offset,
        limit,
        total,
        nextOffset: hasMore ? nextOffset : null,
        hasMore
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch reviews' }, { status: 500 })
  }
}

