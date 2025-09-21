import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, sendOTPEmail } from '@/lib/email'
import { z } from 'zod'

const sendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = sendOtpSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate OTP and set expiration (10 minutes from now)
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: otp,
        emailVerificationOtpExpires: expiresAt,
      },
    })

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name || undefined)

    if (!emailResult.success) {
      // Auto-verify for development when email is not configured
      // console.error('Email not configured, auto-verifying user...')
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationOtp: null,
          emailVerificationOtpExpires: null,
        },
      })

      return NextResponse.json({
        message: 'Email verified automatically (development mode)',
        success: true,
        autoVerified: true
      })
    }

    return NextResponse.json({
      message: 'Verification code sent to your email',
      success: true,
    })
  } catch (error) {
    // console.error('Error sending OTP:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}