import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing token or email' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Invalid or expired login token' },
        { status: 400 }
      )
    }

    // Clear the token after verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: null,
        emailVerificationOtpExpires: null,
        lastLoginAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    // console.error('Verify auto-login error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify login token' },
      { status: 500 }
    )
  }
}