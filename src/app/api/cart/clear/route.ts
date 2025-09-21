import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (session?.user?.id) {
      // Clear cart for authenticated user
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id }
      })
    } else if (sessionId) {
      // Clear cart for guest user
      await prisma.cartItem.deleteMany({
        where: { sessionId }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'No user session or session ID provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}