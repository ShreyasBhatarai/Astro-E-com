import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateOTP, sendOTPEmail } from '@/lib/email'
import { z, ZodError } from 'zod'
import { createAuthRateLimit } from '@/lib/rate-limit'
import { withRateLimit } from '@/lib/api-helpers'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const authRateLimit = createAuthRateLimit()

export async function POST(request: NextRequest) {
  return withRateLimit(request, authRateLimit, async () => {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    const { name, email, phone, password } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate OTP and set expiration (10 minutes from now)
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create user with OTP
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'USER',
        emailVerified: false,
        emailVerificationOtp: otp,
        emailVerificationOtpExpires: expiresAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      }
    })

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name)

    if (!emailResult.success) {
      // Log error but still require verification
      // console.error('Failed to send verification email:', emailResult.error)
      // Email service unavailable, but OTP verification still required
    }

    return NextResponse.json(
      { 
        message: emailResult.success 
          ? 'User registered successfully. Please check your email for verification code.'
          : 'User registered successfully. Please check your email for verification code.',
        user,
        requiresVerification: true
      },
      { status: 201 }
    )
  } catch (error) {
    // console.error('Registration error:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
  })
}