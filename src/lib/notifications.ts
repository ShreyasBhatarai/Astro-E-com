import { prisma } from '@/lib/prisma'

export async function createOrderNotification(
  userId: string,
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED',
  orderNumber: string,
  orderId: string,
  additionalData?: any
) {
  try {
    // Create notification for user
    await prisma.notification.create({
      data: {
        userId,
        type: 'ORDER_STATUS_CHANGED' as const,
        title: getNotificationTitle(type, orderNumber),
        message: getNotificationMessage(type, orderNumber),
        metadata: { 
          orderNumber, 
          orderId,
          ...additionalData
        }
      }
    })

    return { success: true }
  } catch (error) {
    // console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

export async function createAdminOrderNotification(
  type: 'ORDER_CREATED',
  orderNumber: string,
  orderId: string,
  customerName: string,
  total: number
) {
  try {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    // Create notifications for all admins
    const adminNotifications = adminUsers.map(admin => ({
      userId: admin.id,
      type,
      title: 'New Order Received',
      message: `New order ${orderNumber} from ${customerName} - Total: Rs. ${total.toLocaleString()}`,
      metadata: { 
        orderNumber, 
        orderId,
        customerName,
        total
      }
    }))

    if (adminNotifications.length > 0) {
      await prisma.notification.createMany({
        data: adminNotifications
      })
    }

    return { success: true }
  } catch (error) {
    // console.error('Error creating admin notifications:', error)
    return { success: false, error }
  }
}

function getNotificationTitle(type: string, orderNumber: string) {
  switch (type) {
    case 'ORDER_CREATED':
      return 'Order Placed Successfully'
    case 'ORDER_UPDATED':
      return 'Order Status Updated'
    case 'ORDER_SHIPPED':
      return 'Order Shipped'
    case 'ORDER_DELIVERED':
      return 'Order Delivered'
    default:
      return 'Order Update'
  }
}

function getNotificationMessage(type: string, orderNumber: string) {
  switch (type) {
    case 'ORDER_CREATED':
      return `Your order ${orderNumber} has been placed successfully. Our team will contact you shortly to confirm delivery details.`
    case 'ORDER_UPDATED':
      return `Your order ${orderNumber} status has been updated. Check your order details for more information.`
    case 'ORDER_SHIPPED':
      return `Great news! Your order ${orderNumber} has been shipped and is on its way to you.`
    case 'ORDER_DELIVERED':
      return `Your order ${orderNumber} has been delivered successfully. Thank you for shopping with us!`
    default:
      return `Your order ${orderNumber} has been updated.`
  }
}