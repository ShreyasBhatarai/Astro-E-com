import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isOTPValid } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Find user with the email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or OTP' },
        { status: 400 }
      )
    }

    // Verify OTP
    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 400 }
      )
    }

    if (!isOTPValid(otp, user.emailVerificationOtp, user.emailVerificationOtpExpires)) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Generate a password reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Update user with reset token and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: resetToken, // Reuse field for reset token
        emailVerificationOtpExpires: resetTokenExpiry,
      }
    })

    return NextResponse.json({
      success: true,
      resetToken,
      message: 'OTP verified successfully'
    })
  } catch (error) {
    // console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}