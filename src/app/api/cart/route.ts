import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const countOnly = searchParams.get('countOnly') === 'true'

    // If only count is requested, optimize the query
    if (countOnly) {
      let totalItems = 0
      
      if (session?.user?.id) {
        // For authenticated users, count from database
        const cartItemsSum = await prisma.cartItem.aggregate({
          where: { userId: session.user.id },
          _sum: { quantity: true }
        })
        totalItems = cartItemsSum._sum.quantity || 0
      } else if (sessionId) {
        // For guest users, count from database using sessionId
        const cartItemsSum = await prisma.cartItem.aggregate({
          where: { sessionId },
          _sum: { quantity: true }
        })
        totalItems = cartItemsSum._sum.quantity || 0
      }
      
      return NextResponse.json({
        success: true,
        totalItems,
        data: []
      })
    }

    let cartItems: any[] = []

    if (session?.user?.id) {
      // For authenticated users, get from database
      const dbCartItems = await prisma.cartItem.findMany({
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

      cartItems = dbCartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        image: item.product.images[0] || '',
        slug: item.product.slug,
        quantity: item.quantity,
        stock: item.product.stock
      }))
    } else if (sessionId) {
      // For guest users, get from database using sessionId
      const dbCartItems = await prisma.cartItem.findMany({
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

      cartItems = dbCartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        image: item.product.images[0] || '',
        slug: item.product.slug,
        quantity: item.quantity,
        stock: item.product.stock
      }))
    }

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
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID required' },
        { status: 400 }
      )
    }

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
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

    let cartItem

    if (session?.user?.id) {
      // For authenticated users
      cartItem = await prisma.cartItem.upsert({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId
          }
        },
        update: {
          quantity: {
            increment: quantity
          }
        },
        create: {
          userId: session.user.id,
          productId,
          quantity
        }
      })
    } else if (sessionId) {
      // For guest users
      await prisma.cartItem.upsert({
        where: {
          sessionId_productId: {
            sessionId,
            productId
          }
        },
        update: {
          quantity: {
            increment: quantity
          }
        },
        create: {
          sessionId,
          productId,
          quantity
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Session ID required for guests' },
        { status: 400 }
      )
    }

    // Get updated cart
    const cartItems = await (session?.user?.id 
      ? prisma.cartItem.findMany({
          where: { userId: session.user.id },
          include: { product: true }
        })
      : prisma.cartItem.findMany({
          where: { sessionId },
          include: { product: true }
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
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID or quantity' },
        { status: 400 }
      )
    }

    if (quantity === 0) {
      // Remove item
      if (session?.user?.id) {
        await prisma.cartItem.delete({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId
            }
          }
        })
      } else if (sessionId) {
        await prisma.cartItem.delete({
          where: {
            sessionId_productId: {
              sessionId,
              productId
            }
          }
        })
      }
    } else {
      // Update quantity
      if (session?.user?.id) {
        await prisma.cartItem.update({
          where: {
            userId_productId: {
              userId: session.user.id,
              productId
            }
          },
          data: { quantity }
        })
      } else if (sessionId) {
        await prisma.cartItem.update({
          where: {
            sessionId_productId: {
              sessionId,
              productId
            }
          },
          data: { quantity }
        })
      }
    }

    // Get updated cart
    const cartItems = await (session?.user?.id 
      ? prisma.cartItem.findMany({
          where: { userId: session.user.id },
          include: { product: true }
        })
      : prisma.cartItem.findMany({
          where: { sessionId },
          include: { product: true }
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
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (session?.user?.id) {
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id }
      })
    } else if (sessionId) {
      await prisma.cartItem.deleteMany({
        where: { sessionId }
      })
    }

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