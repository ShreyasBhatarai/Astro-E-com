import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/error-handling'
import { ProductWithDetails, CategoryWithCount, ProductFilters, PaginatedResponse, OptimizedCategory } from '@/types'

// Helper function to generate search variations (including pluralization)
function generateSearchVariations(term: string): string[] {
  const variations = [term.toLowerCase()]
  
  // Handle common plural/singular conversions
  const singularRules = [
    { from: /ies$/, to: 'y' },      // batteries -> battery
    { from: /ves$/, to: 'f' },      // wolves -> wolf
    { from: /ves$/, to: 'fe' },     // knives -> knife
    { from: /s$/, to: '' },         // boards -> board
  ]
  
  const pluralRules = [
    { from: /y$/, to: 'ies' },      // battery -> batteries  
    { from: /f$/, to: 'ves' },      // wolf -> wolves
    { from: /fe$/, to: 'ves' },     // knife -> knives
    { from: /$/, to: 's' },         // board -> boards
  ]
  
  // Generate singular variations from plural input
  for (const rule of singularRules) {
    if (rule.from.test(term)) {
      const singular = term.replace(rule.from, rule.to)
      if (singular !== term && singular.length > 2) {
        variations.push(singular)
      }
    }
  }
  
  // Generate plural variations from singular input
  for (const rule of pluralRules) {
    if (rule.from.test(term)) {
      const plural = term.replace(rule.from, rule.to)
      if (plural !== term) {
        variations.push(plural)
      }
    }
  }
  
  // Add common electronics/tech variations
  const techVariations: Record<string, string[]> = {
    'circuit': ['circuits', 'circuitry'],
    'circuits': ['circuit', 'circuitry'],
    'board': ['boards', 'pcb', 'pcbs'],
    'boards': ['board', 'pcb', 'pcbs'],
    'chip': ['chips', 'ic', 'ics', 'microchip', 'microchips'],
    'chips': ['chip', 'ic', 'ics', 'microchip', 'microchips'],
    'battery': ['batteries', 'cell', 'cells'],
    'batteries': ['battery', 'cell', 'cells'],
    'led': ['leds', 'light'],
    'leds': ['led', 'light'],
    'sensor': ['sensors'],
    'sensors': ['sensor'],
    'motor': ['motors'],
    'motors': ['motor'],
    'wire': ['wires', 'cable', 'cables'],
    'wires': ['wire', 'cable', 'cables'],
  }
  
  if (techVariations[term]) {
    variations.push(...techVariations[term])
  }
  
  return [...new Set(variations)] // Remove duplicates
}

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

    // Generate all possible variations for each search term (including pluralization)
    const allVariations: string[] = []
    searchTerms.forEach(term => {
      const variations = generateSearchVariations(term)
      allVariations.push(...variations)
    })

    // Remove duplicates and filter out very short terms
    const uniqueVariations = [...new Set(allVariations)].filter(term => term.length > 1)

    // Case-insensitive partial match for tags via SQL (unnest + ILIKE)
    const q = search.toLowerCase()
    const qinfix = `%${q}%`
    const tagIdRows = await prisma.$queryRaw<Array<{ id: string }>>`\
      SELECT "id" FROM "products"\
      WHERE "isActive" = true AND EXISTS (\
        SELECT 1 FROM unnest("tags") AS t\
        WHERE lower(t) LIKE ${qinfix}\
      )\
    `
    const tagIds = tagIdRows.map(r => r.id)

    // Enhanced search with weighted relevance and pluralization handling
    where.OR = [
      // High priority: exact matches in name and brand
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },

      // High priority: individual original terms in name
      ...searchTerms.map(term => ({
        name: { contains: term, mode: 'insensitive' }
      })),

      // High priority: tag variations matching (includes pluralization and case-insensitive)
      { tags: { hasSome: uniqueVariations.map(v => v.toLowerCase()) } },

      // Medium priority: individual variations in name (for partial matches)
      ...uniqueVariations.slice(0, 10).map(variation => ({ // Limit to first 10 variations for performance
        name: { contains: variation, mode: 'insensitive' }
      })),

      // Medium priority: individual variations in brand
      ...uniqueVariations.slice(0, 5).map(variation => ({ // Limit for performance
        brand: { contains: variation, mode: 'insensitive' }
      })),

      // Lower priority: description and category
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },

      // Lower priority: individual terms in description
      ...searchTerms.map(term => ({
        description: { contains: term, mode: 'insensitive' }
      })),

      // Lower priority: tag exact matches for original terms (case-insensitive)
      ...searchTerms.map(term => ({
        tags: { has: term.toLowerCase() }
      })),

      // New: tags case-insensitive partial matches via raw query
      ...(tagIds.length ? [{ id: { in: tagIds } }] : [])
    ]

    console.log(`🔍 Search enhanced: "${search}" -> variations: [${uniqueVariations.slice(0, 10).join(', ')}]`)
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
          orderBy: { createdAt: 'desc' },
          take: 7
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

    // Compute average across all reviews (not just the first page)
    const avgAgg = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true }
    })
    const averageRating = avgAgg._avg.rating ? Number(avgAgg._avg.rating) : 0

    // Omit Decimal fields like costPrice to ensure plain-object serialization
    const { costPrice: _omitCostPrice, ...rest } = product as any

    return {
      ...rest,
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

    return sortedProducts.map(product => {
      const { costPrice: _omitCostPrice, ...rest } = product as any
      return {
        ...rest,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        weight: product.weight ? Number(product.weight) : null,
        averageRating: ratingsMap[product.id] || 0,
        reviewCount: product._count.reviews
      }
    })
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

    return products.map(product => {
      const { costPrice: _omitCostPrice, ...rest } = product as any
      return {
        ...rest,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        weight: product.weight ? Number(product.weight) : null,
        averageRating: ratingsMap[product.id] || 0,
        reviewCount: product._count.reviews
      }
    })
  } catch (error) {
    // console.error('Error fetching related products:', error)
    throw new Error('Failed to fetch related products')
  }
}