import { prisma } from '@/lib/prisma'
import { 
  CreateProductData, 
  UpdateProductData, 
  AdminProductFilters,
  Product,
  Category,
  PaginatedResponse
} from '@/types'
import { generateSlug } from '@/lib/utils'

// Get paginated products for admin with filtering and sorting
export async function getAdminProducts(filters: AdminProductFilters = {}): Promise<PaginatedResponse<Product & { category: { id: string; name: string; slug: string } }>> {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    stockStatus,
    status,
    isFeatured,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
  }

  if (category) {
    where.categoryId = category
  }

  if (brand) {
    where.brand = {
      contains: brand,
      mode: 'insensitive'
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }

  if (stockStatus) {
    switch (stockStatus) {
      case 'in_stock':
        where.stock = { gt: 10 }
        break
      case 'low_stock':
        where.stock = { lte: 10, gt: 0 }
        break
      case 'out_of_stock':
        where.stock = { lte: 0 }
        break
    }
  }

  if (status !== undefined) {
    where.isActive = status === 'active'
  }

  if (isFeatured !== undefined) {
    where.isFeatured = isFeatured
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Build orderBy clause
  const orderBy: any = {}
  orderBy[sortBy] = sortOrder

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          sku: true,
          price: true,
          originalPrice: true,
          stock: true,
          isActive: true,
          isFeatured: true,
          images: true,
          categoryId: true,
          brand: true,
          weight: true,
          dimensions: true,
          specifications: true,
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
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    // Keep original types for admin (no conversion needed for admin tables)
    const productsWithNumbers = products

    return {
      success: true,
      data: productsWithNumbers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error fetching admin products:', error)
    console.error('Filters used:', filters)
    console.error('Where clause:', where)
    throw new Error('Failed to fetch products')
  }
}

// Get single product by ID for admin
export async function getAdminProductById(id: string): Promise<Product & { category: { id: string; name: string; slug: string } } | null> {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!product) return null
    
    return product
  } catch (error) {
    // console.error('Error fetching product by ID:', error)
    throw new Error('Failed to fetch product')
  }
}

// Create new product
export async function createProduct(data: CreateProductData): Promise<Product> {
  try {
    // Generate unique slug
    let slug = generateSlug(data.name)
    let counter = 1
    let finalSlug = slug

    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Generate SKU if not provided
    let sku = data.sku
    if (!sku) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
      const categoryPrefix = category?.name.substring(0, 3).toUpperCase() || 'PRD'
      const timestamp = Date.now().toString().slice(-6)
      sku = `${categoryPrefix}-${timestamp}`
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        slug: finalSlug,
        sku,
        price: data.price,
        originalPrice: data.originalPrice || null,
        specifications: data.specifications || undefined,
        tags: data.tags || [],
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false
      }
    })

    return {
      ...product,
      price: product.price as any,
      originalPrice: product.originalPrice as any,
      weight: product.weight as any,
    }
  } catch (error) {
    // console.error('Error creating product:', error)
    throw new Error('Failed to create product')
  }
}

// Update product
export async function updateProduct(id: string, data: UpdateProductData): Promise<Product> {
  try {
    // Check if product exists and is not deleted
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id,
      }
    })

    if (!existingProduct) {
      throw new Error('Product not found')
    }

    // Generate new slug if name is being updated
    let updateData: any = { ...data }
    if (data.name && data.name !== existingProduct.name) {
      let slug = generateSlug(data.name)
      let counter = 1
      let finalSlug = slug

      while (await prisma.product.findFirst({ 
        where: { 
          slug: finalSlug,
          NOT: { id }
        } 
      })) {
        finalSlug = `${slug}-${counter}`
        counter++
      }
      updateData.slug = finalSlug
    }

    // Handle specifications
    if (data.specifications !== undefined) {
      updateData.specifications = data.specifications
    }

    // Handle tags
    if (data.tags !== undefined) {
      updateData.tags = data.tags
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    })

    return {
      ...product,
      price: product.price as any,
      originalPrice: product.originalPrice as any,
      weight: product.weight as any,
    }
  } catch (error) {
    // console.error('Error updating product:', error)
    throw new Error('Failed to update product')
  }
}

// Soft delete product
export async function deleteProduct(id: string): Promise<void> {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        id,
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    await prisma.product.delete({
      where: { id }
    })
  } catch (error) {
    // console.error('Error deleting product:', error)
    throw new Error('Failed to delete product')
  }
}

// Toggle product status (active/inactive)
export async function toggleProductStatus(id: string): Promise<Product> {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        id,
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isActive: !product.isActive
      }
    })

    return updatedProduct
  } catch (error) {
    // console.error('Error toggling product status:', error)
    throw new Error('Failed to toggle product status')
  }
}

// Get product stock levels
export async function getProductStockLevels(): Promise<Array<{
  product: Product
  currentStock: number
  reservedStock: number
  availableStock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}>> {
  try {
    const products = await prisma.product.findMany({
      where: {
      },
      include: {
        orderItems: {
          where: {
            order: {
              status: {
                in: ['PENDING', 'PROCESSING', 'PACKAGED', 'SHIPPED']
              }
            }
          }
        }
      }
    })

    return products.map(product => {
      const reservedStock = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const availableStock = product.stock - reservedStock
      
      let status: 'in_stock' | 'low_stock' | 'out_of_stock'
      if (availableStock <= 0) {
        status = 'out_of_stock'
      } else if (availableStock <= 10) {
        status = 'low_stock'
      } else {
        status = 'in_stock'
      }

      return {
        product,
        currentStock: product.stock,
        reservedStock,
        availableStock,
        status
      }
    })
  } catch (error) {
    // console.error('Error fetching product stock levels:', error)
    throw new Error('Failed to fetch stock levels')
  }
}

// Bulk update product status
export async function bulkUpdateProductStatus(ids: string[], isActive: boolean): Promise<{ count: number }> {
  try {
    const result = await prisma.product.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        isActive
      }
    })

    return result
  } catch (error) {
    // console.error('Error bulk updating product status:', error)
    throw new Error('Failed to bulk update product status')
  }
}

// Get low stock products
export async function getLowStockProducts(threshold: number = 10): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: { lte: threshold },
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: {
        stock: 'asc'
      }
    })

    return products
  } catch (error) {
    // console.error('Error fetching low stock products:', error)
    throw new Error('Failed to fetch low stock products')
  }
}