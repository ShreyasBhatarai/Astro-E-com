import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateBannerPositions } from '@/lib/queries/banners'
import { BannerReorderRequest, AdminApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

// PUT /api/admin/banners/reorder - Update banner positions
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body: BannerReorderRequest = await request.json()
    const { banners } = body

    // Validate request body
    if (!banners || !Array.isArray(banners)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected banners array.' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Validate each banner update
    for (const banner of banners) {
      if (!banner.id || typeof banner.position !== 'number' || banner.position < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid banner data. Each banner must have id and position >= 1.' } as AdminApiResponse,
          { status: 400 }
        )
      }
    }

    // Check for duplicate positions
    const positions = banners.map(b => b.position)
    const uniquePositions = new Set(positions)
    if (positions.length !== uniquePositions.size) {
      return NextResponse.json(
        { success: false, error: 'Duplicate positions found. Each banner must have a unique position.' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Update banner positions
    await updateBannerPositions(banners)
    
    return NextResponse.json({
      success: true,
      message: 'Banner positions updated successfully'
    } as AdminApiResponse)
  } catch (error) {
    // console.error('Error updating banner positions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update banner positions' } as AdminApiResponse,
      { status: 500 }
    )
  }
}