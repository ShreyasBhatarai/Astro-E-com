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
    const q = searchTerm
    const qprefix = searchTerm + '%'
    const qinfix = '%' + searchTerm + '%'


    // Get category suggestions first (rank: exact > prefix > infix)
    const categorySuggestions = await prisma.$queryRaw<Array<{ name: string; slug: string }>>`\
      SELECT "name", "slug",\
        (CASE\
          WHEN lower("name") = ${q} THEN 100\
          WHEN lower("name") LIKE ${qprefix} THEN 80\
          WHEN lower("name") LIKE ${qinfix} THEN 60\
          ELSE 0\
        END) AS score\
      FROM "categories"\
      WHERE "isActive" = true\
        AND lower("name") LIKE ${qinfix}\
      ORDER BY score DESC, "name" ASC\
      LIMIT 3\
    `

    // Determine how many product suggestions to return (total 7)
    const productLimit = Math.max(0, 7 - categorySuggestions.length)

    // Product suggestions with ranking: name > brand > tags > description; exact > prefix > infix
    const productSuggestions = productLimit > 0
      ? await prisma.$queryRaw<Array<{ name: string; brand: string | null; slug: string }>>`\
        SELECT "name", "brand", "slug",\
          (\
            (CASE\
              WHEN lower("name") = ${q} THEN 100\
              WHEN lower("name") LIKE ${qprefix} THEN 80\
              WHEN lower("name") LIKE ${qinfix} THEN 60\
              ELSE 0\
            END) +\
            (CASE\
              WHEN "brand" IS NOT NULL AND lower("brand") = ${q} THEN 50\
              WHEN "brand" IS NOT NULL AND lower("brand") LIKE ${qprefix} THEN 40\
              WHEN "brand" IS NOT NULL AND lower("brand") LIKE ${qinfix} THEN 30\
              ELSE 0\
            END) +\
            (CASE\
              WHEN lower("description") LIKE ${qinfix} THEN 10\
              ELSE 0\
            END) +\
            (CASE WHEN EXISTS (SELECT 1 FROM unnest("tags") AS t WHERE lower(t) = ${q}) THEN 35 ELSE 0 END) +\
            (CASE WHEN EXISTS (SELECT 1 FROM unnest("tags") AS t WHERE lower(t) LIKE ${qprefix}) THEN 25 ELSE 0 END) +\
            (CASE WHEN EXISTS (SELECT 1 FROM unnest("tags") AS t WHERE lower(t) LIKE ${qinfix}) THEN 15 ELSE 0 END)\
          ) AS score\
        FROM "products"\
        WHERE "isActive" = true AND (\
          lower("name") LIKE ${qinfix}\
          OR lower("brand") LIKE ${qinfix}\
          OR lower("description") LIKE ${qinfix}\
          OR EXISTS (SELECT 1 FROM unnest("tags") AS t WHERE lower(t) LIKE ${qinfix})\
        )\
        ORDER BY score DESC, "name" ASC\
        LIMIT ${productLimit}\
      `
      : []

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