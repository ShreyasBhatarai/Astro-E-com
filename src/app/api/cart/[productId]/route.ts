import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { quantity, sessionId } = body

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    if (session?.user?.id) {
      // Update for authenticated user
      await prisma.cartItem.updateMany({
        where: {
          userId: session.user.id,
          productId: resolvedParams.productId
        },
        data: { quantity }
      })
    } else if (sessionId) {
      // Update for guest user
      await prisma.cartItem.updateMany({
        where: {
          sessionId,
          productId: resolvedParams.productId
        },
        data: { quantity }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'No user session or session ID provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error updating cart item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (session?.user?.id) {
      // Delete for authenticated user
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id,
          productId: resolvedParams.productId
        }
      })
    } else if (sessionId) {
      // Delete for guest user
      await prisma.cartItem.deleteMany({
        where: {
          sessionId,
          productId: resolvedParams.productId
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'No user session or session ID provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error removing cart item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}