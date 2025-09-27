// Beautiful Email Templates for AstroNova inspired by the provided design

// Beautiful OTP Email Template
export function getOTPEmailTemplate(otp: string, name?: string): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Email Verification - AstroNova</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style="
          margin: 0;
          font-family: 'Poppins', sans-serif;
          background: #ffffff;
          font-size: 14px;
        "
      >
        <div
          style="
            max-width: 680px;
            margin: 0 auto;
            padding: 45px 30px 60px;
            background: #f4f7ff;
            background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner);
            background-repeat: no-repeat;
            background-size: 800px 452px;
            background-position: top center;
            font-size: 14px;
            color: #434343;
          "
        >
          <header>
            <table style="width: 100%;">
              <tbody>
                <tr style="height: 0;">
                  <td>
                    <img
                      alt="AstroNova Logo"
                      src="https://astro-e-com.vercel.app/logo.webp"
                      height="100px"
                      style="height: 100px; width: auto; aspect-ratio: 1/1; background:transparent;"
                    />
                  </td>
                  <td style="text-align: right;">
                    <span
                      style="font-size: 16px; line-height: 30px; color: #ffffff;"
                      >${currentDate}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </header>

          <main>
            <div
              style="
                margin: 0;
                margin-top: 70px;
                padding: 92px 30px 115px;
                background: #ffffff;
                border-radius: 30px;
                text-align: center;
              "
            >
              <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                <h1
                  style="
                    margin: 0;
                    font-size: 24px;
                    font-weight: 500;
                    color: #1f1f1f;
                  "
                >
                  Email Verification
                </h1>
                <p
                  style="
                    margin: 0;
                    margin-top: 17px;
                    font-size: 16px;
                    font-weight: 500;
                  "
                >
                  Hey ${name || 'there'},
                </p>
                <p
                  style="
                    margin: 0;
                    margin-top: 17px;
                    font-weight: 400;
                    letter-spacing: 0.56px;
                    line-height: 1.6;
                  "
                >
                  Thank you for choosing AstroNova! Use the following OTP
                  to complete your email verification. OTP is valid for
                  <span style="font-weight: 600; color: #1f1f1f;">10 minutes</span>.
                  Do not share this code with others, including AstroNova
                  employees.
                </p>
                <p
                  style="
                    margin: 0;
                    margin-top: 60px;
                    font-size: 40px;
                    font-weight: 600;
                    letter-spacing: 25px;
                    color: #ba3d4f;
                  "
                >
                  ${otp}
                </p>
        </div>
      </div>

            <p
              style="
                max-width: 400px;
                margin: 0 auto;
                margin-top: 90px;
                text-align: center;
                font-weight: 400;
                color: #8c8c8c;
              "
            >
              Need help? Ask at
              <a
                href="mailto:astroinf369@gmail.com"
                style="color: #499fb6; text-decoration: none;"
                >astroinf369@gmail.com</a
              >
              or visit our
              <a
                href="${process.env.NEXT_PUBLIC_APP_URL}/support"
                target="_blank"
                style="color: #499fb6; text-decoration: none;"
                >Help Center</a
              >
            </p>
          </main>

          <footer
            style="
              width: 100%;
              max-width: 490px;
              margin: 20px auto 0;
              text-align: center;
              border-top: 1px solid #e6ebf1;
            "
          >
            <p
              style="
                margin: 0;
                margin-top: 40px;
                font-size: 16px;
                font-weight: 600;
                color: #434343;
              "
            >
              AstroNova Foundation
            </p>
            <p style="margin: 0; margin-top: 8px; color: #434343; font-size: 13px;">
              Lattinath marg, Hetauda, Nepal
            </p>
            <div style="margin: 0; margin-top: 16px;">
              <a href="https://www.facebook.com/astroinf369" target="_blank" style="display: inline-block;">
                <img
                  width="36px"
                  alt="Facebook"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook"
                />
              </a>
              <a
                href="https://www.instagram.com/astroinf369/"
                target="_blank"
                style="display: inline-block; margin-left: 8px;"
              >
                <img
                  width="36px"
                  alt="Instagram"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram"
              /></a>
              <a
                href="https://www.youtube.com/@AstronovasLearniverse"
                target="_blank"
                style="display: inline-block; margin-left: 8px;"
              >
                <img
                  width="36px"
                  alt="Youtube"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503195931_210869/email-template-icon-youtube"
              /></a>
              <a
                href="https://www.linkedin.com/company/astro369"
                target="_blank"
                style="display: inline-block; margin-left: 8px;"
              >
                <img
                  width="36px"
                  alt="LinkedIn"
                  src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
              /></a>
        </div>
            <p style="margin: 0; margin-top: 16px; color: #434343; font-size: 12px;">
              Copyright © ${new Date().getFullYear()} AstroNova Foundation. All rights reserved.
            </p>
          </footer>
        </div>
      </body>
    </html>
  `
}

// Beautiful Order Status Email Template
export function getOrderStatusEmailTemplate(data: {
  userEmail: string
  userName: string
  orderNumber: string
  status: string
  orderTotal: number
  reason?: string
}): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })

  const statusMessages = {
    'PENDING': 'Your order has been received and is being processed.',
    'PROCESSING': 'Your order is being prepared for shipment.',
    'PACKAGED': 'Your order has been packaged and is ready for shipping.',
    'SHIPPED': 'Your order has been shipped and is on its way to you.',
    'DELIVERED': 'Your order has been delivered successfully.',
    'CANCELLED': 'Your order has been cancelled.',
    'FAILED': 'There was an issue processing your order.'
  }

  const statusColors = {
    'PENDING': '#f59e0b',
    'PROCESSING': '#3b82f6',
    'PACKAGED': '#8b5cf6',
    'SHIPPED': '#06b6d4',
    'DELIVERED': '#10b981',
    'CANCELLED': '#ef4444',
    'FAILED': '#6b7280'
  }

  const statusEmojis = {
    'PENDING': '⏳',
    'PROCESSING': '🔄',
    'PACKAGED': '📦',
    'SHIPPED': '🚚',
    'DELIVERED': '✅',
    'CANCELLED': '❌',
    'FAILED': '⚠️'
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Order Status Update - AstroNova</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style="
          margin: 0;
          font-family: 'Poppins', sans-serif;
          background: #ffffff;
          font-size: 14px;
        "
      >
        <div
          style="
            max-width: 680px;
            margin: 0 auto;
            padding: 45px 30px 60px;
            background: #f4f7ff;
            background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner);
            background-repeat: no-repeat;
            background-size: 800px 452px;
            background-position: top center;
            font-size: 14px;
            color: #434343;
          "
        >
          <header>
            <table style="width: 100%;">
              <tbody>
                <tr style="height: 0;">
                  <td>
                    <img
                      alt="AstroNova Logo"
                      src="https://astro-e-com.vercel.app/logo.webp"
                      height="100px"
                      style="height: 100px; width: auto; aspect-ratio: 1/1; background:transparent;"
                    />
                  </td>
                  <td style="text-align: right;">
                    <span
                      style="font-size: 16px; line-height: 30px; color: #ffffff;"
                      >${currentDate}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </header>

          <main>
            <div
              style="
                margin: 0;
                margin-top: 70px;
                padding: 92px 30px 115px;
                background: #ffffff;
                border-radius: 30px;
                text-align: center;
              "
            >
              <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                <h1
                  style="
                    margin: 0;
                    font-size: 24px;
                    font-weight: 500;
                    color: #1f1f1f;
                  "
                >
                  Order Status Update
                </h1>
                <p
                  style="
                    margin: 0;
                    margin-top: 17px;
                    font-size: 16px;
                    font-weight: 500;
                  "
                >
                  Hey ${data.userName},
                </p>
                <p
                  style="
                    margin: 0;
                    margin-top: 17px;
                    font-weight: 400;
                    letter-spacing: 0.56px;
                    line-height: 1.6;
                  "
                >
                  Your order #${data.orderNumber} status has been updated.
                  ${statusMessages[data.status as keyof typeof statusMessages]}
                </p>

                ${['CANCELLED','FAILED'].includes(data.status) && data.reason ? `
                  <p style="margin: 0; margin-top: 12px; font-weight: 500; color: #ef4444;">
                    Reason: ${data.reason}
                  </p>
                ` : ''}
                
                <div
                  style="
                    margin: 40px 0;
                    padding: 25px;
                    background: #f8fafc;
                    border-radius: 15px;
                    border: 1px solid #e2e8f0;
                  "
                >
                  <div
                    style="
                      font-size: 48px;
                      margin-bottom: 10px;
                    "
                  >
                    ${statusEmojis[data.status as keyof typeof statusEmojis] || '📋'}
      </div>
                  
                  <div
                    style="
                      display: inline-block;
                      background: ${statusColors[data.status as keyof typeof statusColors] || '#6b7280'};
                      color: white;
                      padding: 8px 20px;
                      border-radius: 25px;
                      font-weight: 600;
                      text-transform: uppercase;
                      font-size: 12px;
                      letter-spacing: 1px;
                      margin-bottom: 15px;
                    "
                  >
                    ${data.status}
        </div>
                  
                  <div style="margin-top: 15px; font-size: 12px; color: #6b7280;">
                    <div><strong>Order:</strong> #${data.orderNumber}</div>
                    <div style="margin-top: 5px;"><strong>Total:</strong> Rs. ${data.orderTotal.toLocaleString()}</div>
        </div>
      </div>

                <div
                  style="
                    margin: 30px 0;
                  "
                >
                  <a
                    href="${process.env.NEXT_PUBLIC_APP_URL}/orders"
                    style="
                      display: inline-block;
                      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                      color: white;
                      padding: 12px 30px;
                      text-decoration: none;
                      border-radius: 25px;
                      font-weight: 500;
                      font-size: 14px;
                      letter-spacing: 0.5px;
                    "
                  >
                    Track Your Order
                  </a>
        </div>
        </div>
      </div>

            <p
              style="
                max-width: 400px;
                margin: 0 auto;
                margin-top: 90px;
                text-align: center;
                font-weight: 400;
                color: #8c8c8c;
              "
            >
              Need help? Ask at
              <a
                href="mailto:astroinf369@gmail.com"
                style="color: #499fb6; text-decoration: none;"
                >astroinf369@gmail.com</a
              >
              or call us at
              <a
                href="tel:+9855027369"
                style="color: #499fb6; text-decoration: none;"
                >+985-5027369</a
              >
            </p>
          </main>

          <footer
            style="
              width: 100%;
              max-width: 490px;
              margin: 20px auto 0;
              text-align: center;
              border-top: 1px solid #e6ebf1;
            "
          >
            <p
              style="
                margin: 0;
                margin-top: 40px;
                font-size: 16px;
                font-weight: 600;
                color: #434343;
              "
            >
              AstroNova Foundation
            </p>
            <p style="margin: 0; margin-top: 8px; color: #434343; font-size: 13px;">
              Lattinath marg, Hetauda, Nepal
            </p>
            <div style="margin: 0; margin-top: 16px;">
              <a href="https://www.facebook.com/astroinf369" target="_blank" style="display: inline-block;">
                <img
                  width="36px"
                  alt="Facebook"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook"
                />
              </a>
              <a
                href="https://www.instagram.com/astroinf369/"
                target="_blank"
                style="display: inline-block; margin-left: 8px;"
              >
                <img
                  width="36px"
                  alt="Instagram"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram"
              /></a>
              <a
                href="https://www.youtube.com/@AstronovasLearniverse"
                target="_blank"
                style="display: inline-block; margin-left: 8px;"
              >
                <img
                  width="36px"
                  alt="Youtube"
                  src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503195931_210869/email-template-icon-youtube"
              /></a>
              <a
                href="https://www.linkedin.com/company/astro369"
                target="_blank"
                style="display: inline-block; margin-left: 8px;"
              >
                <img
                  width="36px"
                  alt="LinkedIn"
                  src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
              /></a>
        </div>
            <p style="margin: 0; margin-top: 16px; color: #434343; font-size: 12px;">
              Copyright © ${new Date().getFullYear()} AstroNova Foundation. All rights reserved.
            </p>
          </footer>
        </div>
      </body>
    </html>
  `
}