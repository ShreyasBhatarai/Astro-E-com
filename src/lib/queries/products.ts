import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/error-handling'
import { ProductWithDetails, CategoryWithCount, ProductFilters, PaginatedResponse, OptimizedCategory } from '@/types'

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<ProductWithDetails>> {
  const {
    category,
    minPrice,
    maxPrice,
    search,
    sort = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 20,
    rating,
    brand
  } = filters

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    isActive: true,
  }

  if (category) {
    where.category = {
      slug: category
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }

  if (search) {
    const searchTerms = search.split(' ').filter(term => term.length > 0)
    
    // Enhanced search with weighted relevance
    where.OR = [
      // High priority: exact matches in name and brand
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      
      // Medium priority: individual terms in name
      ...searchTerms.map(term => ({
        name: { contains: term, mode: 'insensitive' }
      })),
      
      // Medium priority: tags matching
      { tags: { hasSome: searchTerms } },
      
      // Lower priority: description and category
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
      
      // Individual terms in description
      ...searchTerms.map(term => ({
        description: { contains: term, mode: 'insensitive' }
      })),
      
      // Individual terms in tags
      ...searchTerms.map(term => ({
        tags: { has: term }
      }))
    ]
  }

  if (brand) {
    where.brand = { contains: brand, mode: 'insensitive' }
  }

  if (rating) {
    where.reviews = {
      some: {
        rating: { gte: rating }
      }
    }
  }

  // Build orderBy clause
  let orderBy: any = {}
  if (sort === 'price') {
    orderBy = { price: order }
  } else if (sort === 'name') {
    orderBy = { name: order }
  } else if (sort === 'rating') {
    // For now, fallback to createdAt since averageRating is not a DB column
    // TODO: Implement proper rating sort with aggregation
    orderBy = { createdAt: order }
  } else {
    orderBy = { createdAt: order }
  }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          sku: true,
          price: true,
          originalPrice: true,
          images: true, // Will be optimized to only first image in mapping
          stock: true,
          categoryId: true,
          brand: true,
          weight: true,
          dimensions: true,
          specifications: true,
          isActive: true,
          isFeatured: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              reviews: true,
              wishlist: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ])

    // Efficiently calculate average ratings for products with reviews
    const productIds = products.filter(p => p._count.reviews > 0).map(p => p.id)
    const avgRatings = productIds.length > 0 ? await prisma.review.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds }
      },
      _avg: {
        rating: true
      }
    }) : []

    const ratingsMap = avgRatings.reduce((acc, item) => {
      acc[item.productId] = Number(item._avg.rating) || 0
      return acc
    }, {} as Record<string, number>)

    const productsWithDetails: ProductWithDetails[] = products.map(product => ({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      images: [product.images[0]].filter(Boolean), // Only first image for product cards
      averageRating: ratingsMap[product.id] || 0,
      reviewCount: product._count.reviews
    }))

    return {
      success: true,
      data: productsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  } catch (error) {
    // console.error('Error fetching products:', error)
    throw new Error('Failed to fetch products')
  }
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  try {
    // Decode URL-encoded slug to handle special characters
    const decodedSlug = decodeURIComponent(slug)
    
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: slug },
          { slug: decodedSlug }
        ],
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            reviews: true,
            wishlist: true
          }
        }
      }
    })

    if (!product) return null

    const averageRating = product.reviews.length > 0 
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0

    return {
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      averageRating,
      reviewCount: product._count.reviews
    }
  } catch (error) {
    // console.error('Error fetching product by slug:', error)
    throw new Error('Failed to fetch product')
  }
}

export async function getCategories(): Promise<OptimizedCategory[]> {
  return withErrorHandling(async () => {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      _count: {
        products: category._count.products
      }
    }))
  }, 'getCategories')
}

export async function getFeaturedProducts(limit: number = 8): Promise<ProductWithDetails[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sku: true,
        price: true,
        originalPrice: true,
        images: true,
        stock: true,
        categoryId: true,
        brand: true,
        weight: true,
        dimensions: true,
        specifications: true,
        isActive: true,
        isFeatured: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            reviews: true,
            wishlist: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get average ratings for products that have reviews
    const productIds = products.filter(p => p._count.reviews > 0).map(p => p.id)
    const avgRatings = productIds.length > 0 ? await prisma.review.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds }
      },
      _avg: {
        rating: true
      }
    }) : []

    const ratingsMap = avgRatings.reduce((acc, item) => {
      acc[item.productId] = item._avg.rating || 0
      return acc
    }, {} as Record<string, number>)

    return products.map(product => ({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      images: [product.images[0]].filter(Boolean), // Only first image for product cards
      averageRating: Number(ratingsMap[product.id]) || 0,
      reviewCount: product._count.reviews
    }))
  } catch (error) {
    // console.error('Error fetching featured products:', error)
    throw new Error('Failed to fetch featured products')
  }
}

export async function getProductsByIds(ids: string[]): Promise<ProductWithDetails[]> {
  try {
    if (!ids || ids.length === 0) {
      return []
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: ids
        },
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            reviews: true,
            wishlist: true
          }
        }
      }
    })

    // Get average ratings for products that have reviews
    const productIds = products.filter(p => p._count.reviews > 0).map(p => p.id)
    const avgRatings = productIds.length > 0 ? await prisma.review.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds }
      },
      _avg: {
        rating: true
      }
    }) : []

    const ratingsMap = avgRatings.reduce((acc, item) => {
      acc[item.productId] = item._avg.rating || 0
      return acc
    }, {} as Record<string, number>)

    // Sort products to match the order of IDs provided
    const sortedProducts = ids
      .map(id => products.find(product => product.id === id))
      .filter((product): product is typeof products[number] => Boolean(product))

    return sortedProducts.map(product => ({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      averageRating: ratingsMap[product.id] || 0,
      reviewCount: product._count.reviews
    }))
  } catch (error) {
    // console.error('Error fetching products by IDs:', error)
    throw new Error('Failed to fetch products by IDs')
  }
}

export async function getRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<ProductWithDetails[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId,
        id: {
          not: productId
        }
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            reviews: true,
            wishlist: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get average ratings for products that have reviews
    const productIds = products.filter(p => p._count.reviews > 0).map(p => p.id)
    const avgRatings = productIds.length > 0 ? await prisma.review.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds }
      },
      _avg: {
        rating: true
      }
    }) : []

    const ratingsMap = avgRatings.reduce((acc, item) => {
      acc[item.productId] = item._avg.rating || 0
      return acc
    }, {} as Record<string, number>)

    return products.map(product => ({
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      averageRating: ratingsMap[product.id] || 0,
      reviewCount: product._count.reviews
    }))
  } catch (error) {
    // console.error('Error fetching related products:', error)
    throw new Error('Failed to fetch related products')
  }
}