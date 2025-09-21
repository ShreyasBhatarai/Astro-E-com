import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail, generateOTP } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Return error if email doesn't exist (as requested by user)
    if (!user) {
      return NextResponse.json(
        { error: 'This email does not exist. Please try signing up.' },
        { status: 404 }
      )
    }

    // Generate OTP for password reset
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store the OTP in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: otp,
        emailVerificationOtpExpires: otpExpiry
      }
    })

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name || 'User')
    
    if (!emailResult.success) {
      // If email fails, still return success but with different message
      // console.error('Failed to send OTP email:', emailResult.error)
      return NextResponse.json({
        success: true,
        message: 'OTP generated but email service is temporarily unavailable. Please contact support.',
        emailSent: false
      })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address. Please check your inbox.',
      emailSent: true
    })
  } catch (error) {
    // console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}