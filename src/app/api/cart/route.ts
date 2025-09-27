import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'

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

    // If only count is requested, optimize the query
    if (countOnly) {
      const cartItemsSum = await prisma.cartItem.aggregate({
        where: { userId },
        _sum: { quantity: true }
      })
      const totalItems = cartItemsSum._sum.quantity || 0

      return NextResponse.json({
        success: true,
        totalItems,
        data: []
      })
    }

    const dbCartItems = await prisma.cartItem.findMany({
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

    const cartItems: any[] = dbCartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      image: item.product.images[0] || '',
      slug: item.product.slug,
      quantity: item.quantity,
      stock: item.product.stock
    }))

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        total,
        totalItems
      }
    })
  } catch (error) {
    // console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { productId, quantity = 1 } = body

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

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID required' },
        { status: 400 }
      )
    }

    // Check if product exists and is active (use findFirst because isActive is not part of unique index)
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or unavailable' },
        { status: 404 }
      )
    }

    // Authenticated users only
    await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId
        }
      },
      update: {
        quantity: {
          increment: quantity
        }
      },
      create: {
        userId,
        productId,
        quantity
      }
    })

    // Get updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
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
    // console.error('Error adding to cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { productId, quantity } = body

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

    if (!productId || quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID or quantity' },
        { status: 400 }
      )
    }

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      })
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId,
            productId
          }
        },
        data: { quantity }
      })
    }

    // Get updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
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
    // console.error('Error updating cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

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

    return NextResponse.json({
      success: true,
      data: {
        items: [],
        total: 0,
        totalItems: 0
      }
    })
  } catch (error) {
    // console.error('Error clearing cart:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}