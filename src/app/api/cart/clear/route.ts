import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: 'insensitive' } },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    await prisma.cartItem.deleteMany({
      where: { userId: dbUser.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}