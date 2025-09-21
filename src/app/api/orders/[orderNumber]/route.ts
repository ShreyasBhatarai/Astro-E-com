import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

interface RouteParams {
  params: Promise<{
    orderNumber: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { orderNumber } = resolvedParams

    if (!orderNumber) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Order number is required'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Find order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
        userId: session.user.id
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                slug: true,
                price: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!order) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Order not found'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Convert Decimal fields to numbers
    const serializedOrder = {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price)
        }
      }))
    }

    const response: ApiResponse<any> = {
      success: true,
      data: serializedOrder,
      message: 'Order retrieved successfully'
    }

    return NextResponse.json(response)
    
  } catch (error) {
    // console.error('Error fetching order:', error)
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch order'
    }

    return NextResponse.json(response, { status: 500 })
  }
}