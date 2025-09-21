import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBannerById, updateBanner, deleteBanner, toggleBannerStatus } from '@/lib/queries/banners'
import { UpdateBannerData, AdminApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

function isValidRedirectUrl(url: string, base: string) {
  if (url.startsWith('/')) return true
  try {
    const u = new URL(url, base)
    return ['http:', 'https:'].includes(u.protocol)
  } catch {
    return false
  }
}

// GET /api/admin/banners/[id] - Get single banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const { id } = await params
    const banner = await getBannerById(id)
    
    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' } as AdminApiResponse,
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: banner
    } as AdminApiResponse)
  } catch (error) {
    // console.error('Error fetching banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banner' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// PUT /api/admin/banners/[id] - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body = await request.json()
    const { image, redirectUrl, isActive } = body

    // Validate URL format if provided
    if (redirectUrl && !isValidRedirectUrl(redirectUrl, request.nextUrl.origin)) {
      return NextResponse.json(
        { success: false, error: 'Invalid redirect URL format' } as AdminApiResponse,
        { status: 400 }
      )
    }

    const updateData: UpdateBannerData = {
      ...(image && { image }),
      ...(redirectUrl && { redirectUrl }),
      ...(isActive !== undefined && { isActive })
    }

    const { id } = await params
    const banner = await updateBanner(id, updateData)
    
    return NextResponse.json({
      success: true,
      data: banner,
      message: 'Banner updated successfully'
    } as AdminApiResponse)
  } catch (error) {
    // console.error('Error updating banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update banner' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/admin/banners/[id] - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const { id } = await params
    await deleteBanner(id)
    
    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    } as AdminApiResponse)
  } catch (error) {
    // console.error('Error deleting banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete banner' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// PATCH /api/admin/banners/[id] - Toggle banner status or update positions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body = await request.json()
    const { isActive } = body

    // Special sentinel value: if isActive is null, it means toggle status
    // This allows the same endpoint to handle both explicit boolean updates and toggle requests
    if (isActive === null) {
      const { id } = await params
      const banner = await toggleBannerStatus(id)
      return NextResponse.json({
        success: true,
        data: banner,
        message: 'Banner status toggled successfully'
      } as AdminApiResponse)
    }

    // Otherwise, update the banner with the provided data
    const updateData: UpdateBannerData = {
      ...(isActive !== undefined && { isActive })
    }

    const { id } = await params
    const banner = await updateBanner(id, updateData)
    
    return NextResponse.json({
      success: true,
      data: banner,
      message: 'Banner updated successfully'
    } as AdminApiResponse)
  } catch (error) {
    // console.error('Error updating banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update banner' } as AdminApiResponse,
      { status: 500 }
    )
  }
}