import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()
    const resolvedParams = await params
    const orderNumber = resolvedParams.orderNumber

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: session.user.id
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order can be cancelled (only pending orders)
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled' },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        reason: reason || 'Cancelled by customer',
        updatedAt: new Date()
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                slug: true
              }
            }
          }
        }
      }
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'ORDER_STATUS_CHANGED',
        title: 'Order Cancelled',
        message: `Your order ${orderNumber} has been cancelled successfully.`,
        metadata: { 
          orderNumber: orderNumber, 
          orderId: order.id,
          status: 'CANCELLED'
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedOrder,
        subtotal: Number(updatedOrder.subtotal),
        shippingCost: Number(updatedOrder.shippingCost),
        total: Number(updatedOrder.total),
        orderItems: updatedOrder.orderItems.map(item => ({
          ...item,
          price: Number(item.price)
        }))
      },
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    // console.error('Error cancelling order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}