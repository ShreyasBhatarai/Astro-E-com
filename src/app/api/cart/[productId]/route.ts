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

    // Get updated cart items to return
    const cartItems = await (session?.user?.id 
      ? prisma.cartItem.findMany({
          where: { userId: session.user.id },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                slug: true,
                stock: true
              }
            }
          }
        })
      : prisma.cartItem.findMany({
          where: { sessionId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                slug: true,
                stock: true
              }
            }
          }
        })
    )

    const formattedItems = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      image: item.product.images[0] || '',
      slug: item.product.slug,
      quantity: item.quantity,
      stock: item.product.stock
    }))

    const total = formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = formattedItems.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
        total,
        totalItems
      }
    })
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

    // Get updated cart items to return
    const cartItems = await (session?.user?.id 
      ? prisma.cartItem.findMany({
          where: { userId: session.user.id },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                slug: true,
                stock: true
              }
            }
          }
        })
      : prisma.cartItem.findMany({
          where: { sessionId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                slug: true,
                stock: true
              }
            }
          }
        })
    )

    const formattedItems = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      image: item.product.images[0] || '',
      slug: item.product.slug,
      quantity: item.quantity,
      stock: item.product.stock
    }))

    const total = formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = formattedItems.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: formattedItems,
        total,
        totalItems
      }
    })
  } catch (error) {
    // console.error('Error removing cart item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}