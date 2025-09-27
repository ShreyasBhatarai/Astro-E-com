import { prisma } from '@/lib/prisma'
import { ProductWithDetails, ApiResponse } from '@/types'

export async function getUserWishlist(userId: string): Promise<ProductWithDetails[]> {
  try {
    const wishlistItems = await prisma.wishlist.findMany({
      where: {
        userId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            price: true,
            originalPrice: true,
            stock: true,
            isActive: true,
            category: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                reviews: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const productIds = wishlistItems.map((w) => w.product.id)
    const ratings = productIds.length > 0 ? await prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true }
    }) : []

    return wishlistItems.map(item => {
      const product = item.product
      const ratingInfo = ratings.find(r => r.productId === product.id)
      const averageRating = ratingInfo? Number((ratingInfo._avg.rating || 0).toFixed(1)) : 0
      const reviewCount = ratingInfo? ratingInfo._count.rating : product._count.reviews
      return {
        ...product,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        reviews: [], // Empty array to satisfy type
        _count: {
          reviews: reviewCount,
          wishlist: 0
        },
        averageRating,
        reviewCount
      }
    }) as any
  } catch (error) {
    // console.error('Error fetching user wishlist:', error)
    throw new Error('Failed to fetch wishlist')
  }
}

export async function addToWishlist(userId: string, productId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    if (existingItem) {
      return {
        success: true,
        message: 'Product already in wishlist',
        data: { success: true }
      }
    }

    // Verify product exists and is active (use findFirst because isActive is not part of unique index)
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true
      }
    })

    if (!product) {
      return {
        success: false,
        message: 'Product not found',
        data: { success: false }
      }
    }

    await prisma.wishlist.create({
      data: {
        userId,
        productId
      }
    })

    return {
      success: true,
      message: 'Product added to wishlist',
      data: { success: true }
    }
  } catch (error) {
    // console.error('Error adding to wishlist:', error)
    return {
      success: false,
      message: 'Failed to add product to wishlist',
      data: { success: false }
    }
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const deletedItem = await prisma.wishlist.deleteMany({
      where: {
        userId,
        productId
      }
    })

    if (deletedItem.count === 0) {
      return {
        success: false,
        message: 'Product not found in wishlist',
        data: { success: false }
      }
    }

    return {
      success: true,
      message: 'Product removed from wishlist',
      data: { success: true }
    }
  } catch (error) {
    // console.error('Error removing from wishlist:', error)
    return {
      success: false,
      message: 'Failed to remove product from wishlist',
      data: { success: false }
    }
  }
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    return !!wishlistItem
  } catch (error) {
    // console.error('Error checking wishlist status:', error)
    return false
  }
}

export async function getWishlistCount(userId: string): Promise<number> {
  try {
    const count = await prisma.wishlist.count({
      where: {
        userId
      }
    })

    return count
  } catch (error) {
    // console.error('Error fetching wishlist count:', error)
    return 0
  }
}

export async function clearWishlist(userId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    await prisma.wishlist.deleteMany({
      where: {
        userId
      }
    })

    return {
      success: true,
      message: 'Wishlist cleared',
      data: { success: true }
    }
  } catch (error) {
    // console.error('Error clearing wishlist:', error)
    return {
      success: false,
      message: 'Failed to clear wishlist',
      data: { success: false }
    }
  }
}

// Guest user localStorage functions
export const guestWishlist = {
  get: (): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const wishlist = localStorage.getItem('guest-wishlist')
      return wishlist ? JSON.parse(wishlist) : []
    } catch {
      return []
    }
  },

  add: (productId: string): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const wishlist = guestWishlist.get()
      if (!wishlist.includes(productId)) {
        wishlist.push(productId)
        localStorage.setItem('guest-wishlist', JSON.stringify(wishlist))
      }
      return true
    } catch {
      return false
    }
  },

  remove: (productId: string): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const wishlist = guestWishlist.get()
      const updatedWishlist = wishlist.filter(id => id !== productId)
      localStorage.setItem('guest-wishlist', JSON.stringify(updatedWishlist))
      return true
    } catch {
      return false
    }
  },

  clear: (): boolean => {
    if (typeof window === 'undefined') return false
    try {
      localStorage.removeItem('guest-wishlist')
      return true
    } catch {
      return false
    }
  },

  isInWishlist: (productId: string): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const wishlist = guestWishlist.get()
      return wishlist.includes(productId)
    } catch {
      return false
    }
  }
}