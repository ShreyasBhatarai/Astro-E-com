import { NextResponse } from 'next/server'
import { getActiveBanners } from '@/lib/queries/banners'
import { ApiResponse } from '@/types'

// GET /api/banners - Get active banners for storefront
export async function GET() {
  try {
    const banners = await getActiveBanners()
    
    return NextResponse.json({
      success: true,
      data: banners
    } as ApiResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
      },
    })
  } catch (error) {
    // console.error('Error fetching active banners:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' } as ApiResponse,
      { status: 500 }
    )
  }
}