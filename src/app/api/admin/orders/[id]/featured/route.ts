import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
  const orderId = resolvedParams.id
    const body = await request.json()
    const { isFeatured } = body

    if (typeof isFeatured !== 'boolean') {
      return NextResponse.json({ message: 'Invalid featured status provided' }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { isFeatured }
    })

    return NextResponse.json({ success: true, data: updatedOrder })
  } catch (error) {
    // console.error('Error toggling order featured status:', error)
    return NextResponse.json(
      { message: 'Failed to update order featured status' },
      { status: 500 }
    )
  }
}