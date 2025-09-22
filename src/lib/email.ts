import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { getOTPEmailTemplate, getOrderStatusEmailTemplate } from './email-templates'

// Enhanced email configuration with better error handling
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  }

  return nodemailer.createTransport(config)
}

const transporter = createTransporter()

// Verify email configuration on startup
const verifyEmailConfig = async () => {
  try {
    await transporter.verify()
    console.log('✅ Email server connection verified')
  } catch (error) {
    console.error('❌ Email server connection failed:', error)
  }
}

// Call verification (but don't block startup)
verifyEmailConfig()

export async function sendOrderNotificationEmail(
  to: string,
  orderNumber: string,
  status: string,
  customerName: string
) {
  try {
    const subject = getEmailSubject(status, orderNumber)
    const htmlContent = getEmailContent(status, orderNumber, customerName)

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Astronova <noreply@astronova.com>',
      to,
      subject,
      html: htmlContent,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

function getEmailSubject(status: string, orderNumber: string): string {
  switch (status) {
    case 'PENDING':
      return `Order Confirmed - ${orderNumber}`
    case 'PROCESSING':
      return `Order Processing - ${orderNumber}`
    case 'SHIPPED':
      return `Order Shipped - ${orderNumber}`
    case 'DELIVERED':
      return `Order Delivered - ${orderNumber}`
    case 'CANCELLED':
      return `Order Cancelled - ${orderNumber}`
    default:
      return `Order Update - ${orderNumber}`
  }
}

function getEmailContent(status: string, orderNumber: string, customerName: string): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc; margin: 0; padding: 20px; }
      .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
      .header { background: linear-gradient(135deg, #4f46e5, #7c3aed, #3b82f6); color: white; padding: 40px 30px; text-align: center; position: relative; }
      .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); }
      .content { background: white; padding: 40px 30px; position: relative; }
      .footer { background: linear-gradient(to right, #f8fafc, #f1f5f9); padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; }
      .button { display: inline-block; background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.35); transition: all 0.3s ease; }
      .button:hover { transform: translateY(-1px); box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4); }
      .status-badge { display: inline-block; padding: 6px 16px; border-radius: 25px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .order-box { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin: 25px 0; position: relative; }
      .order-box::before { content: '✨'; position: absolute; top: 15px; right: 20px; font-size: 20px; }
    </style>
  `

  const statusBadge = getStatusBadge(status)
  const statusMessage = getStatusMessage(status, orderNumber)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Update</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="/logo.webp" alt="Astronova Logo" style="height: 80px; width: auto; margin-bottom: 15px; max-width: 100%; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none'" />
          </div>
          <h1 style="margin: 0; font-size: 32px; font-weight: 700; text-align: center;"><span style="color: white;">Astronova</span></h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95; text-align: center; font-weight: 300;">Premium Quality • Fast Delivery • Trusted Service</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px; font-weight: 600;">Hi ${customerName}! 👋</h2>
          
          <div class="order-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <div>
                <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">Order #${orderNumber}</h3>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Thank you for your order!</p>
              </div>
              ${statusBadge}
            </div>
          </div>
          
          ${statusMessage}
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}" class="button">
              View Order Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions about your order, please don't hesitate to contact our support team.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 15px 0; font-size: 16px; color: #374151; font-weight: 500;">🚀 Thank you for choosing Astronova!</p>
          <p style="margin: 0 0 15px 0; color: #6b7280;">We're committed to delivering premium quality products with exceptional service.</p>
          <div style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #4f46e5; text-decoration: none; font-weight: 500; margin: 0 15px;">🏠 Visit Store</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="color: #4f46e5; text-decoration: none; font-weight: 500; margin: 0 15px;">📞 Contact Support</a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Astronova. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getStatusBadge(status: string): string {
  const badges = {
    PENDING: '<span class="status-badge" style="background: #fef3c7; color: #92400e;">Pending</span>',
    PROCESSING: '<span class="status-badge" style="background: #dbeafe; color: #1e40af;">Processing</span>',
    SHIPPED: '<span class="status-badge" style="background: #e0e7ff; color: #5b21b6;">Shipped</span>',
    DELIVERED: '<span class="status-badge" style="background: #d1fae5; color: #065f46;">Delivered</span>',
    CANCELLED: '<span class="status-badge" style="background: #fee2e2; color: #991b1b;">Cancelled</span>',
  }
  return badges[status as keyof typeof badges] || badges.PENDING
}

function getStatusMessage(status: string, orderNumber: string): string {
  switch (status) {
    case 'PENDING':
      return `
        <p>Great news! Your order has been successfully placed.</p>
        <p><strong>What's next?</strong></p>
        <ul>
          <li>Our team will contact you shortly to confirm delivery details</li>
          <li>We'll process your order and prepare it for shipment</li>
          <li>You'll receive updates as your order progresses</li>
        </ul>
      `
    case 'PROCESSING':
      return `
        <p>Your order is now being processed by our team.</p>
        <p>We're carefully preparing your educational materials and will have them ready for shipment soon.</p>
      `
    case 'SHIPPED':
      return `
        <p>Exciting news! Your order has been shipped and is on its way to you.</p>
        <p>You can expect to receive your educational materials within the next few days.</p>
      `
    case 'DELIVERED':
      return `
        <p>Your order has been successfully delivered!</p>
        <p>We hope you're satisfied with your educational materials. If you have a moment, we'd love to hear your feedback.</p>
      `
    case 'CANCELLED':
      return `
        <p>Your order has been cancelled as requested.</p>
        <p>If this was not intentional or if you have any questions, please contact our support team immediately.</p>
      `
    default:
      return `<p>There has been an update to your order status.</p>`
  }
}

// Generate OTP function
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

// Validate OTP function
export function isOTPValid(otp: string, storedOtp: string, expiresAt: Date): boolean {
  if (!otp || !storedOtp) return false
  if (otp !== storedOtp) return false
  if (new Date() > expiresAt) return false
  return true
}

// Send OTP Email function
export async function sendOTPEmail(to: string, otp: string, name?: string) {
  try {
    // Verify email configuration before sending
    if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      throw new Error('Email configuration is incomplete. Please check environment variables.')
    }
    
    const htmlContent = getOTPEmailTemplate(otp, name)

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AstroNova <noreply@astronova.com>',
      to,
      subject: 'Verify Your Email - AstroNova',
      html: htmlContent,
    }

    console.log('📧 Attempting to send OTP email to:', to)
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ OTP email sent successfully:', result.messageId)

    return { success: true }
  } catch (error) {
    console.error('Error sending OTP email:', error)
    return { success: false, error }
  }
}

// Send Order Status Email function
export async function sendOrderStatusEmail(data: {
  userEmail: string
  userName: string
  orderNumber: string
  status: string
  orderTotal: number
}) {
  try {
    const htmlContent = getOrderStatusEmailTemplate(data)

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'AstroNova <noreply@astronova.com>',
      to: data.userEmail,
      subject: `Order Status Update - #${data.orderNumber}`,
      html: htmlContent,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending order status email:', error)
    return { success: false, error }
  }
}

// Send Welcome Email function
export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Astro Ecom</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="/logo.webp" alt="Astro Ecom Logo" style="height: 60px; width: auto; margin-bottom: 10px;" />
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;"><span style="color: white;">Astro</span> <span style="color: #60a5fa;">Ecom</span></h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to Our Community!</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${name}!</h2>
            
            <p>Thank you for joining Astro Ecom! We're excited to have you as part of our community.</p>
            
            <p><strong>What you can do now:</strong></p>
            <ul>
              <li>Browse our wide range of products</li>
              <li>Create your wishlist of favorite items</li>
              <li>Track your orders and delivery status</li>
              <li>Get exclusive deals and offers</li>
            </ul>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" class="button">
                Start Shopping
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, our support team is here to help!
            </p>
          </div>
          
          <div class="footer">
            <p>Happy shopping with Astro Ecom!</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #3b82f6; text-decoration: none;">Visit Our Store</a> |
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Astro Ecom <noreply@astroecom.com>',
      to,
      subject: 'Welcome to Astro Ecom! 🎉',
      html: htmlContent,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error }
  }
}

// Send order notification to admin
export async function sendOrderNotificationToAdmin(
  orderNumber: string,
  status: string,
  customerName: string,
  customerEmail: string,
  orderTotal: number
) {
  try {
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL
    
    if (!adminEmail) {
      console.warn('Admin email not configured, skipping admin notification')
      return { success: false, error: 'Admin email not configured' }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
          .order-details { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .urgent { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="/logo.webp" alt="Astronova Logo" style="height: 60px; width: auto; margin-bottom: 10px;" />
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;"><span style="color: white;">Astronova</span> <span style="color: #60a5fa;">Admin</span></h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">New Order Alert</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">🚨 New Order Received!</h2>
            
            <div class="order-details">
              <h3 style="margin-top: 0; color: #374151;">Order Details</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                  <strong>Order Number:</strong><br>
                  <span style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">#${orderNumber}</span>
                </div>
                <div>
                  <strong>Status:</strong><br>
                  <span class="status-badge urgent">${status}</span>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong>Customer:</strong><br>
                  ${customerName}
                </div>
                <div>
                  <strong>Email:</strong><br>
                  <a href="mailto:${customerEmail}" style="color: #3b82f6;">${customerEmail}</a>
                </div>
              </div>
              
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <strong>Order Total: </strong>
                <span style="font-size: 18px; font-weight: 600; color: #059669;">रु ${orderTotal.toLocaleString()}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                📋 View Order in Admin Panel
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from your Astronova store.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color: #3b82f6; text-decoration: none;">Admin Dashboard</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Astronova <noreply@astronova.com>',
      to: adminEmail,
      subject: `🚨 New Order #${orderNumber} - रु ${orderTotal.toLocaleString()}`,
      html: htmlContent,
    })

    console.log('✅ Admin notification email sent successfully:', result.messageId)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error)
    return { success: false, error }
  }
}