export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export const emailTemplates = {
  orderCreated: (data: { orderNumber: string; customerName: string; total: number }): EmailTemplate => ({
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 20px; text-align: center;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.webp" alt="Astro Ecom" style="height: 40px;">
          <h1 style="margin: 20px 0;"><span style="color: white;">Astro</span> <span style="color: #3b82f6;">Ecom</span></h1>
          <h2 style="color: white; margin: 20px 0;">Order Confirmed!</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hi ${data.customerName},</p>
          <p>Thank you for your order! We've received your order <strong>${data.orderNumber}</strong> and it's being processed.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> Rs. ${data.total}</p>
          </div>
          <p>We'll send you another email when your order is shipped.</p>
          <p>Best regards,<br>The Astro Ecom Team</p>
        </div>
      </div>
    `,
    text: `Hi ${data.customerName},\n\nThank you for your order! We've received your order ${data.orderNumber} and it's being processed.\n\nOrder Details:\nOrder Number: ${data.orderNumber}\nTotal Amount: Rs. ${data.total}\n\nWe'll send you another email when your order is shipped.\n\nBest regards,\nThe Astro Ecom Team`
  }),

  orderStatusChanged: (data: { orderNumber: string; customerName: string; status: string }): EmailTemplate => ({
    subject: `Order Update - ${data.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 20px; text-align: center;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.webp" alt="Astro Ecom" style="height: 40px;">
          <h1 style="margin: 20px 0;"><span style="color: white;">Astro</span> <span style="color: #3b82f6;">Ecom</span></h1>
          <h2 style="color: white; margin: 20px 0;">Order Update</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hi ${data.customerName},</p>
          <p>Your order <strong>${data.orderNumber}</strong> status has been updated to: <strong>${data.status}</strong></p>
          <p>You can track your order status anytime by visiting our website.</p>
          <p>Best regards,<br>The Astro Ecom Team</p>
        </div>
      </div>
    `,
    text: `Hi ${data.customerName},\n\nYour order ${data.orderNumber} status has been updated to: ${data.status}\n\nYou can track your order status anytime by visiting our website.\n\nBest regards,\nThe Astro Ecom Team`
  }),

  productLowStock: (data: { productName: string; currentStock: number }): EmailTemplate => ({
    subject: `Low Stock Alert - ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fff3cd; padding: 20px; text-align: center;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.webp" alt="Astro Ecom" style="height: 40px;">
          <h1 style="margin: 20px 0;"><span style="color: #374151;">Astro</span> <span style="color: #3b82f6;">Ecom</span></h1>
          <h2 style="color: #856404; margin: 20px 0;">Low Stock Alert</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hello Admin,</p>
          <p>The product <strong>${data.productName}</strong> is running low on stock.</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>Current Stock:</strong> ${data.currentStock} units</p>
          </div>
          <p>Please consider restocking this item to avoid going out of stock.</p>
          <p>Best regards,<br>Astro Ecom System</p>
        </div>
      </div>
    `,
    text: `Hello Admin,\n\nThe product ${data.productName} is running low on stock.\n\nCurrent Stock: ${data.currentStock} units\n\nPlease consider restocking this item to avoid going out of stock.\n\nBest regards,\nAstro Ecom System`
  }),

  userRegistered: (data: { userName: string; userEmail: string }): EmailTemplate => ({
    subject: 'Welcome to Astro Ecom!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 20px; text-align: center;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.webp" alt="Astro Ecom" style="height: 40px;">
          <h1 style="margin: 20px 0;"><span style="color: white;">Astro</span> <span style="color: #3b82f6;">Ecom</span></h1>
          <h2 style="color: white; margin: 20px 0;">Welcome!</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hi ${data.userName},</p>
          <p>Welcome to Astro Ecom! We're excited to have you as part of our community.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse our wide range of products</li>
            <li>Track your orders</li>
            <li>Manage your wishlist</li>
            <li>Get exclusive deals and offers</li>
          </ul>
          <p>Start shopping now and discover amazing products!</p>
          <p>Best regards,<br>The Astro Ecom Team</p>
        </div>
      </div>
    `,
    text: `Hi ${data.userName},\n\nWelcome to Astro Ecom! We're excited to have you as part of our community.\n\nYou can now:\n- Browse our wide range of products\n- Track your orders\n- Manage your wishlist\n- Get exclusive deals and offers\n\nStart shopping now and discover amazing products!\n\nBest regards,\nThe Astro Ecom Team`
  }),

  systemAlert: (data: { title: string; message: string }): EmailTemplate => ({
    subject: `System Alert - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8d7da; padding: 20px; text-align: center;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.webp" alt="Astro Ecom" style="height: 40px;">
          <h1 style="margin: 20px 0;"><span style="color: #374151;">Astro</span> <span style="color: #3b82f6;">Ecom</span></h1>
          <h2 style="color: #721c24; margin: 20px 0;">System Alert</h2>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #721c24;">${data.title}</h2>
          <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0;">${data.message}</p>
          </div>
          <p>Please take immediate action if required.</p>
          <p>Best regards,<br>Astro Ecom System</p>
        </div>
      </div>
    `,
    text: `System Alert - ${data.title}\n\n${data.message}\n\nPlease take immediate action if required.\n\nBest regards,\nAstro Ecom System`
  })
}