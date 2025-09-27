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
    const { quantity } = body

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

    const userId = dbUser.id

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    // Update for authenticated user only
    await prisma.cartItem.updateMany({
      where: {
        userId,
        productId: resolvedParams.productId
      },
      data: { quantity }
    })

    // Get updated cart items to return
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
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
      where: {
        userId: dbUser.id,
        productId: resolvedParams.productId
      }
    })

    // Get updated cart items to return
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: dbUser.id },
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