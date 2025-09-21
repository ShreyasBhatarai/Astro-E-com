import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { AdminApiResponse } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id
    const body = await request.json()
    const {
      shippingCost,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingProvince
    } = body

    // Validate required fields
    if (typeof shippingCost !== 'number' || shippingCost < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid shipping cost is required' } as AdminApiResponse,
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingCity || !shippingDistrict || !shippingProvince) {
      return NextResponse.json(
        { success: false, error: 'Address, city, district, and province are required' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' } as AdminApiResponse,
        { status: 404 }
      )
    }

    // Calculate new total with updated shipping cost
    const newTotal = Number(existingOrder.subtotal) + shippingCost

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingCost,
        shippingAddress,
        shippingCity,
        shippingDistrict,
        shippingProvince,
        // shippingPostalCode field not in schema
        total: newTotal,
        updatedAt: new Date()
      },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Shipping information updated successfully'
    } as AdminApiResponse)

  } catch (error) {
    // console.error('Error updating shipping information:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update shipping information' } as AdminApiResponse,
      { status: 500 }
    )
  }
}