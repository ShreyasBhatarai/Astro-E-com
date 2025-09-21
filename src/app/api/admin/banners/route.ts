import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminBanners, createBanner } from '@/lib/queries/banners'
import { CreateBannerData, AdminApiResponse } from '@/types'
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

// GET /api/admin/banners - Fetch all banners for admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const banners = await getAdminBanners()
    
    return NextResponse.json({
      success: true,
      data: banners
    } as AdminApiResponse)
  } catch (error) {
    // console.error('Error fetching admin banners:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// POST /api/admin/banners - Create new banner
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!image || !redirectUrl) {
      return NextResponse.json(
        { success: false, error: 'Image and redirect URL are required' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Validate URL format
    if (!isValidRedirectUrl(redirectUrl, request.nextUrl.origin)) {
      return NextResponse.json(
        { success: false, error: 'Invalid redirect URL format' } as AdminApiResponse,
        { status: 400 }
      )
    }

    const bannerData: CreateBannerData = {
      image,
      redirectUrl,
      isActive: isActive ?? true
    }

    const banner = await createBanner(bannerData)
    
    return NextResponse.json({
      success: true,
      data: banner,
      message: 'Banner created successfully'
    } as AdminApiResponse, { status: 201 })
  } catch (error) {
    // console.error('Error creating banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create banner' } as AdminApiResponse,
      { status: 500 }
    )
  }
}