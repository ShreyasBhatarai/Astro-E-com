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

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { id } = resolvedParams
    const { isActive } = await request.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid isActive value' },
        { status: 400 }
      )
    }

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct
    })
  } catch (error) {
    // console.error('Error toggling product status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product status' },
      { status: 500 }
    )
  }
}