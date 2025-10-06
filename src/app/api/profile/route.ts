import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail } from '@/lib/email'
import { validateNepalPhone } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true } })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, email, phone } = body

  // Validate required fields
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }

  // Validate phone number if provided
  if (phone && phone.trim() && !validateNepalPhone(phone)) {
    return NextResponse.json({ error: 'Please enter exactly 10 digits for phone number' }, { status: 400 })
  }

  try {
    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true, emailVerified: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed
    const isEmailChanged = currentUser.email !== email

    // Check if phone is being changed
    const isPhoneChanged = currentUser.phone !== phone

    // Check for email uniqueness (if email is changed)
    if (isEmailChanged) {
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: session.user.id }
        }
      })

      if (existingEmailUser) {
        return NextResponse.json({ 
          error: 'This email is already registered with another account' 
        }, { status: 400 })
      }
    }

    // Check for phone uniqueness (if phone is provided and changed)
    if (isPhoneChanged && phone && phone.trim()) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: session.user.id }
        }
      })

      if (existingPhoneUser) {
        return NextResponse.json({ 
          error: 'This phone number is already registered with another account' 
        }, { status: 400 })
      }
    }

    // If email is changed, require verification
    if (isEmailChanged) {
      // Generate OTP for email verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store pending email change in OTP field with special format
      // Format: "EMAIL_CHANGE:{newEmail}:{otp}"
      const otpData = `EMAIL_CHANGE:${email}:${otp}`
      
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          emailVerificationOtp: otpData,
          emailVerificationOtpExpires: otpExpiry
        }
      })

      // Send OTP email
      await sendOTPEmail(email, otp, name.trim())

      return NextResponse.json({
        success: true,
        message: 'Verification email sent to your new email address. Please verify to complete the change.',
        requiresEmailVerification: true
      })
    }

    // Update profile (name and phone only if email not changed)
    const updateData: any = {
      name: name.trim()
    }

    if (!isEmailChanged) {
      updateData.email = email
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim() || null
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
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
      user: updated,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    // console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update profile. Please try again.' 
    }, { status: 500 })
  }
}

