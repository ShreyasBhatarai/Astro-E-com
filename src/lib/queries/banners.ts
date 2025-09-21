import { prisma } from '@/lib/prisma'
import { CreateBannerData, UpdateBannerData, BannerKanbanItem, CarouselBanner, BannerPositionUpdate } from '@/types'

/**
 * Get all banners for admin management with position-based sorting
 */
export async function getAdminBanners(): Promise<BannerKanbanItem[]> {
  try {
    const banners = await prisma.banner.findMany({

      orderBy: {
        position: 'asc'
      },
      select: {
        id: true,
        image: true,
        redirectUrl: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return banners
  } catch (error) {
    // console.error('Error fetching admin banners:', error)
    throw new Error('Failed to fetch banners')
  }
}

/**
 * Get active banners for storefront carousel
 */
export async function getActiveBanners(): Promise<CarouselBanner[]> {
  try {
    const banners = await prisma.banner.findMany({
    where: {
      isActive: true
      },
      orderBy: {
        position: 'asc'
      },
      select: {
        id: true,
        image: true,
        redirectUrl: true,
        position: true
      }
    })

    return banners
  } catch (error) {
    // console.error('Error fetching active banners:', error)
    throw new Error('Failed to fetch active banners')
  }
}

/**
 * Create a new banner with auto-assigned position
 */
export async function createBanner(data: CreateBannerData): Promise<BannerKanbanItem> {
  try {
    // Get the highest position and add 1
    const lastBanner = await prisma.banner.findFirst({
 
      orderBy: {
        position: 'desc'
      },
      select: {
        position: true
      }
    })

    const newPosition = (lastBanner?.position || 0) + 1

    const banner = await prisma.banner.create({
      data: {
        image: data.image,
        redirectUrl: data.redirectUrl,
        position: newPosition,
        isActive: data.isActive ?? true
      },
      select: {
        id: true,
        image: true,
        redirectUrl: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return banner
  } catch (error) {
    // console.error('Error creating banner:', error)
    throw new Error('Failed to create banner')
  }
}

/**
 * Update banner information
 */
export async function updateBanner(id: string, data: UpdateBannerData): Promise<BannerKanbanItem> {
  try {
    // First verify the banner exists and is not deleted
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!existingBanner) {
      throw new Error('Banner not found')
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(data.image && { image: data.image }),
        ...(data.redirectUrl && { redirectUrl: data.redirectUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      select: {
        id: true,
        image: true,
        redirectUrl: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return banner
  } catch (error) {
    // console.error('Error updating banner:', error)
    throw new Error('Failed to update banner')
  }
}

/**
 * Update banner positions for Kanban drag-and-drop
 */
export async function updateBannerPositions(updates: BannerPositionUpdate[]): Promise<void> {
  try {
    await prisma.$transaction(
      updates.map(update =>
        prisma.banner.updateMany({
          where: {
            id: update.id,
        
          },
          data: {
            position: update.position
          }
        })
      )
    )
  } catch (error) {
    // console.error('Error updating banner positions:', error)
    throw new Error('Failed to update banner positions')
  }
}

/**
 * Soft delete a banner
 */
export async function deleteBanner(id: string): Promise<void> {
  try {
    const result = await prisma.banner.delete({
      where: { id }
    })

    if (!result) {
      throw new Error('Banner not found')
    }
  } catch (error) {
    // console.error('Error deleting banner:', error)
    throw new Error('Failed to delete banner')
  }
}

/**
 * Toggle banner active status
 */
export async function toggleBannerStatus(id: string): Promise<BannerKanbanItem> {
  try {
    const banner = await prisma.banner.findFirst({
      where: {
        id
      },
      select: {
        isActive: true
      }
    })

    if (!banner) {
      throw new Error('Banner not found')
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        isActive: !banner.isActive
      },
      select: {
        id: true,
        image: true,
        redirectUrl: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return updatedBanner
  } catch (error) {
    // console.error('Error toggling banner status:', error)
    throw new Error('Failed to toggle banner status')
  }
}

/**
 * Get single banner by ID
 */
export async function getBannerById(id: string): Promise<BannerKanbanItem | null> {
  try {
    const banner = await prisma.banner.findFirst({
      where: {
        id
      },
      select: {
        id: true,
        image: true,
        redirectUrl: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return banner
  } catch (error) {
    // console.error('Error fetching banner by ID:', error)
    throw new Error('Failed to fetch banner')
  }
}