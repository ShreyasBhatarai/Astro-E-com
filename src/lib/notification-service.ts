import { prisma } from '@/lib/prisma'
// No longer needed - keeping for future use
// import { getOTPEmailTemplate, getOrderStatusEmailTemplate } from '@/lib/email-templates'
import { NotificationType } from '@prisma/client'
import { sendOrderStatusEmail } from './email'

interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: any
  sendEmail?: boolean
}

export async function createNotification(data: CreateNotificationData) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || null,
        emailSent: false
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    // Send email if requested
    if (data.sendEmail && notification.user.email) {
      await sendNotificationEmail(notification)
    }

    return notification
  } catch (error) {
    // console.error('Error creating notification:', error)
    throw error
  }
}

export async function sendNotificationEmail(notification: any) {
  try {
    const userData = {
      userName: notification.user.name || 'User',
      userEmail: notification.user.email
    }

    let subject = notification.title
    let success = false

    switch (notification.type) {
      case 'ORDER_CREATED':
      case 'ORDER_STATUS_CHANGED':
        // Use the new order status email template
        const orderData = {
          userEmail: userData.userEmail,
          userName: userData.userName,
          orderNumber: notification.metadata?.orderNumber || '',
          status: notification.metadata?.status || 'PENDING',
          orderTotal: notification.metadata?.total || 0
        }
        const result = await sendOrderStatusEmail(orderData)
        success = result.success
        break
      
      case 'PRODUCT_LOW_STOCK':
        // For low stock alerts, we can just mark as processed
        // In the future, we could implement a dedicated low stock email template
        success = true
        break
      
      case 'USER_REGISTERED':
        // Could implement a welcome email template here in the future
        success = true
        break
      
      case 'SYSTEM_ALERT':
        // For system alerts, we can use a simple notification
        success = true
        break
      
      default:
        // Generic notification - just mark as sent
        success = true
    }

    // Mark email as sent if successful
    if (success) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailSent: true }
      })
    }

    return success
  } catch (error) {
    // console.error('Error sending notification email:', error)
    return false
  }
}

// Helper functions for common notification types
export async function notifyOrderCreated(userId: string, orderData: { orderNumber: string; total: number }) {
  return createNotification({
    userId,
    type: 'ORDER_CREATED',
    title: 'Order Confirmed',
    message: `Your order ${orderData.orderNumber} has been confirmed.`,
    metadata: orderData,
    sendEmail: true
  })
}

export async function notifyOrderStatusChanged(userId: string, orderData: { orderNumber: string; status: string }) {
  return createNotification({
    userId,
    type: 'ORDER_STATUS_CHANGED',
    title: 'Order Status Update',
    message: `Your order ${orderData.orderNumber} is now ${orderData.status.toLowerCase()}.`,
    metadata: orderData,
    sendEmail: true
  })
}

export async function notifyLowStock(adminUserId: string, productData: { productName: string; currentStock: number }) {
  return createNotification({
    userId: adminUserId,
    type: 'PRODUCT_LOW_STOCK',
    title: 'Low Stock Alert',
    message: `${productData.productName} is running low on stock (${productData.currentStock} remaining).`,
    metadata: productData,
    sendEmail: true
  })
}

export async function notifyUserRegistered(userId: string) {
  return createNotification({
    userId,
    type: 'USER_REGISTERED',
    title: 'Welcome to AstroNova!',
    message: 'Thank you for joining our community. Start exploring our products!',
    sendEmail: true
  })
}