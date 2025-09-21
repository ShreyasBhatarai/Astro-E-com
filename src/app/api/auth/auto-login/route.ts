import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.redirect(new URL('/login?error=Invalid%20login%20link', request.url))
    }

    // Find user with matching token and email
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationOtp: token,
        emailVerificationOtpExpires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=Invalid%20or%20expired%20login%20link', request.url))
    }

    // Clear the token after use
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: null,
        emailVerificationOtpExpires: null,
        lastLoginAt: new Date()
      }
    })

    // Create a redirect URL with a special auto-login token
    const autoLoginToken = Math.random().toString(36).substring(2, 15)
    
    // Store the auto-login token temporarily (we'll use the same field but with a shorter expiry)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: autoLoginToken,
        emailVerificationOtpExpires: new Date(Date.now() + 30 * 1000) // 30 seconds
      }
    })

    // Redirect to a page that will handle the auto-login
    return NextResponse.redirect(new URL(`/auth/auto-login?token=${autoLoginToken}&email=${encodeURIComponent(email)}`, request.url))
  } catch (error) {
    // console.error('Auto-login error:', error)
    return NextResponse.redirect(new URL('/login?error=Login%20failed', request.url))
  }
}