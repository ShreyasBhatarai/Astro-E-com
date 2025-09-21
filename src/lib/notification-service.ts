import { prisma } from '@/lib/prisma'
import { emailTemplates } from '@/lib/email-templates'
import { NotificationType } from '@prisma/client'
import { sendOrderNotificationEmail } from './email'

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
    let template
    const userData = {
      userName: notification.user.name || 'User',
      userEmail: notification.user.email
    }

    switch (notification.type) {
      case 'ORDER_CREATED':
        template = emailTemplates.orderCreated({
          orderNumber: notification.metadata?.orderNumber || '',
          customerName: userData.userName,
          total: notification.metadata?.total || 0
        })
        break
      
      case 'ORDER_STATUS_CHANGED':
        template = emailTemplates.orderStatusChanged({
          orderNumber: notification.metadata?.orderNumber || '',
          customerName: userData.userName,
          status: notification.metadata?.status || ''
        })
        break
      
      case 'PRODUCT_LOW_STOCK':
        template = emailTemplates.productLowStock({
          productName: notification.metadata?.productName || '',
          currentStock: notification.metadata?.currentStock || 0
        })
        break
      
      case 'USER_REGISTERED':
        template = emailTemplates.userRegistered(userData)
        break
      
      case 'SYSTEM_ALERT':
        template = emailTemplates.systemAlert({
          title: notification.title,
          message: notification.message
        })
        break
      
      default:
        // Generic notification email
        template = {
          subject: notification.title,
          html: `<p>${notification.message}</p>`,
          text: notification.message
        }
    }

    // Here you would integrate with your email service (SendGrid, Nodemailer, etc.)
    // For now, we'll just log it
    // Email would be sent in production
    await sendOrderNotificationEmail(notification.user.email, template.subject, template.html, template.text)

    // Mark email as sent
    await prisma.notification.update({
      where: { id: notification.id },
      data: { emailSent: true }
    })

    return true
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
    title: 'Welcome to Astro E-com!',
    message: 'Thank you for joining our community. Start exploring our products!',
    sendEmail: true
  })
}