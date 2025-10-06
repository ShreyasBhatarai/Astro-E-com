import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { otp } = await req.json()

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 })
    }

    // Get user with pending email change
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerificationOtp: true,
        emailVerificationOtpExpires: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtp.startsWith('EMAIL_CHANGE:')) {
      return NextResponse.json({ 
        error: 'No pending email change found' 
      }, { status: 400 })
    }

    // Parse the stored data: "EMAIL_CHANGE:{newEmail}:{otp}"
    const [, pendingEmail, storedOtp] = user.emailVerificationOtp.split(':')

    if (!pendingEmail || !storedOtp) {
      return NextResponse.json({ 
        error: 'Invalid email change data' 
      }, { status: 400 })
    }

    // Check if OTP is expired
    if (!user.emailVerificationOtpExpires || new Date() > user.emailVerificationOtpExpires) {
      return NextResponse.json({ 
        error: 'OTP has expired. Please request a new verification.' 
      }, { status: 400 })
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    // Update user email and clear pending fields
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: pendingEmail,
        emailVerified: true,
        emailVerificationOtp: null,
        emailVerificationOtpExpires: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Email address updated successfully!',
      user: updatedUser
    })

  } catch (error) {
    // console.error('Email verification error:', error)
    return NextResponse.json({ 
      error: 'Failed to verify email. Please try again.' 
    }, { status: 500 })
  }
}

// Resend OTP
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with pending email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerificationOtp: true,
        name: true
      }
    })

    if (!user || !user.emailVerificationOtp || !user.emailVerificationOtp.startsWith('EMAIL_CHANGE:')) {
      return NextResponse.json({ 
        error: 'No pending email change found' 
      }, { status: 400 })
    }

    // Parse the stored data to get pending email
    const [, pendingEmail] = user.emailVerificationOtp.split(':')

    if (!pendingEmail) {
      return NextResponse.json({ 
        error: 'Invalid email change data' 
      }, { status: 400 })
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    const otpData = `EMAIL_CHANGE:${pendingEmail}:${otp}`

    // Update OTP in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerificationOtp: otpData,
        emailVerificationOtpExpires: otpExpiry
      }
    })

    // Send new OTP email
    const { sendOTPEmail } = await import('@/lib/email')
    await sendOTPEmail(pendingEmail, otp, user.name || 'User')

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email address.'
    })

  } catch (error) {
    // console.error('Resend OTP error:', error)
    return NextResponse.json({ 
      error: 'Failed to resend verification code. Please try again.' 
    }, { status: 500 })
  }
}