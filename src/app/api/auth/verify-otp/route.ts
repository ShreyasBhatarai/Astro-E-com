import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isOTPValid, sendWelcomeEmail } from '@/lib/email'
import { z } from 'zod'

const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = verifyOtpSchema.parse(body)

    // Find user with OTP details (case-insensitive)
    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        emailVerified: true,
        emailVerificationOtp: true,
        emailVerificationOtpExpires: true,
      }
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

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify OTP
    const isValid = isOTPValid(
      otp,
      user.emailVerificationOtp,
      user.emailVerificationOtpExpires
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Update user as verified and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationOtp: null,
        emailVerificationOtpExpires: null,
      },
    })

    // Send welcome email
    await sendWelcomeEmail(email, user.name || 'User')

    return NextResponse.json({
      message: 'Email verified successfully!',
      success: true,
    })
  } catch (error) {
    // console.error('Error verifying OTP:', error)
    
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