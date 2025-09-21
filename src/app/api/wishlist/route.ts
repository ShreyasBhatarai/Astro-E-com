import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addToWishlist, removeFromWishlist, getUserWishlist, clearWishlist } from '@/lib/queries/wishlist'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Authentication required'
      }
      return NextResponse.json(response, { status: 401 })
    }
    
    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'

    if (countOnly) {
      // Only return count for header optimization
      const count = await prisma.wishlist.count({
        where: { userId }
      })
      
      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count },
        message: 'Wishlist count fetched successfully'
      }
      
      return NextResponse.json(response)
    }

    const wishlist = await getUserWishlist(userId)

    const response: ApiResponse<typeof wishlist> = {
      success: true,
      data: wishlist,
      message: 'Wishlist fetched successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    // console.error('Error fetching wishlist:', error)
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch wishlist'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Authentication required'
      }
      return NextResponse.json(response, { status: 401 })
    }
    
    const userId = session.user.id
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Product ID is required'
      }
      return NextResponse.json(response, { status: 400 })
    }

    const result = await addToWishlist(userId, productId)

    return NextResponse.json(result)
  } catch (error) {
    // console.error('Error adding to wishlist:', error)
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to add product to wishlist'
    }

    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Authentication required'
      }
      return NextResponse.json(response, { status: 401 })
    }
    
    const userId = session.user.id
    
    // Check if request has a body
    const contentLength = request.headers.get('content-length')
    let productId: string | undefined

    if (contentLength && parseInt(contentLength) > 0) {
      try {
        const body = await request.json()
        productId = body.productId
      } catch (parseError) {
        // If JSON parsing fails, treat as clear all
        productId = undefined
      }
    }

    if (!productId) {
      // Clear entire wishlist
      const result = await clearWishlist(userId)
      return NextResponse.json(result, { status: 200 })
    }

    // Remove specific product
    const result = await removeFromWishlist(userId, productId)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // console.error('Error removing from wishlist:', error)
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to remove product from wishlist'
    }

    return NextResponse.json(response, { status: 500 })
  }
}