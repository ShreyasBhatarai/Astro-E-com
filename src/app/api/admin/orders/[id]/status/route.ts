import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusEmail } from '@/lib/email'
import { createNotification } from '@/lib/notification-service'
import { NotificationType } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    const resolvedParams = await params
    const orderId = resolvedParams.id

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Get current order to check previous status
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    // Decrease stock if status changes from PENDING to PROCESSING
    if (currentOrder.status === 'PENDING' && status === 'PROCESSING') {
      const stockUpdates = order.orderItems.map(item => 
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      )
      
      await Promise.all(stockUpdates)
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: getNotificationType(status) as NotificationType,
        title: getNotificationTitle(status),
        message: getNotificationMessage(status, order.orderNumber),
        metadata: { 
          orderNumber: order.orderNumber, 
          orderId: order.id,
          status 
        }
      }
    })

    // Send both email and push notification to user
    const customerName = order.shippingName || order.user?.name || 'Customer'
    const customerEmail = order.user?.email
    
    if (order.userId) {
      // Send push notification
      await createNotification({
        userId: order.userId,
        type: getNotificationType(status),
        title: getNotificationTitle(status),
        message: getNotificationMessage(status, order.orderNumber),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status,
          total: Number(order.total)
        },
        sendEmail: false // We'll send email separately for better control
      })
    }
    
    // Send beautiful email notification using new templates
    if (customerEmail) {
      try {
        await sendOrderStatusEmail({
          userEmail: customerEmail,
          userName: customerName,
          orderNumber: order.orderNumber,
          status: status,
          orderTotal: Number(order.total)
        })
        console.log(`✅ Order status email sent to ${customerEmail} for order ${order.orderNumber}`)
      } catch (emailError) {
        console.error('❌ Failed to send order status email:', emailError)
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    // console.error('Error updating order status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}

function getNotificationType(status: string): NotificationType {
  switch (status) {
    case 'PROCESSING':
      return NotificationType.ORDER_STATUS_CHANGED
    case 'SHIPPED':
      return NotificationType.ORDER_STATUS_CHANGED
    case 'DELIVERED':
      return NotificationType.ORDER_STATUS_CHANGED
    case 'CANCELLED':
      return NotificationType.ORDER_STATUS_CHANGED
    default:
      return NotificationType.ORDER_STATUS_CHANGED
  }
}

function getNotificationTitle(status: string) {
  switch (status) {
    case 'PROCESSING':
      return 'Order Being Processed'
    case 'SHIPPED':
      return 'Order Shipped'
    case 'DELIVERED':
      return 'Order Delivered'
    case 'CANCELLED':
      return 'Order Cancelled'
    default:
      return 'Order Updated'
  }
}

function getNotificationMessage(status: string, orderNumber: string) {
  switch (status) {
    case 'PROCESSING':
      return `Your order ${orderNumber} is now being processed. We'll notify you once it's ready for shipment.`
    case 'SHIPPED':
      return `Great news! Your order ${orderNumber} has been shipped and is on its way to you.`
    case 'DELIVERED':
      return `Your order ${orderNumber} has been delivered successfully. Thank you for shopping with us!`
    case 'CANCELLED':
      return `Your order ${orderNumber} has been cancelled. If you have any questions, please contact support.`
    default:
      return `Your order ${orderNumber} status has been updated to ${status.toLowerCase()}.`
  }
}