import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSearchRateLimit } from '@/lib/rate-limit'
import { withRateLimit } from '@/lib/api-helpers'

const searchRateLimit = createSearchRateLimit()

export async function GET(request: NextRequest) {
  return withRateLimit(request, searchRateLimit, async () => {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const searchTerm = query.trim().toLowerCase()

    // Split search term for better tag matching
    const searchTerms = searchTerm.split(' ').filter(term => term.length > 0)
    
    // Get product suggestions based on name, brand, description, and tags
    const productSuggestions = await prisma.product.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                brand: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                tags: {
                  hasSome: searchTerms
                }
              },
              // Individual tag matching for split terms
              ...searchTerms.map(term => ({
                tags: {
                  has: term
                }
              }))
            ]
          },
          {
            isActive: true
          }
        ]
      },
      select: {
        name: true,
        brand: true,
        slug: true,
        tags: true
      },
      take: 8,
      orderBy: [
        {
          name: 'asc'
        }
      ]
    })

    // Get category suggestions
    const categorySuggestions = await prisma.category.findMany({
      where: {
        AND: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            isActive: true
          },
          {
          }
        ]
      },
      select: {
        name: true,
        slug: true
      },
      take: 3,
      orderBy: {
        name: 'asc'
      }
    })

    // Format suggestions
    const suggestions = [
      // Add category suggestions first
      ...categorySuggestions.map(category => ({
        type: 'category' as const,
        text: category.name,
        url: `/categories/${category.slug}`
      })),
      // Add product suggestions
      ...productSuggestions.map(product => ({
        type: 'product' as const,
        text: product.name,
        url: `/products/${product.slug}`,
        brand: product.brand
      }))
    ].slice(0, 8) // Limit to 8 total suggestions

    return NextResponse.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    // console.error('Error fetching search suggestions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
  })
}