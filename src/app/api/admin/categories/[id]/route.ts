import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { AdminApiResponse } from '@/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const categoryId = resolvedParams.id
    const body = await request.json()
    const { name, image, isActive } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' } as AdminApiResponse,
        { status: 404 }
      )
    }

    // Check if category name already exists (excluding current category)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        NOT: {
          id: categoryId
        }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Generate slug from name if name changed
    const slug = name !== existingCategory.name
      ? name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : existingCategory.slug

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
        image: image || null,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    } as AdminApiResponse)

  } catch (error) {
    // console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const categoryId = resolvedParams.id
    const body = await request.json()

    // For PATCH, we only update the fields that are provided
    const updateData: any = {}
    
    if (body.hasOwnProperty('isActive')) {
      updateData.isActive = body.isActive
    }
    
    if (body.hasOwnProperty('name')) {
      if (!body.name) {
        return NextResponse.json(
          { success: false, error: 'Category name cannot be empty' } as AdminApiResponse,
          { status: 400 }
        )
      }
      
      // Check for duplicate name if name is being updated
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: body.name,
            mode: 'insensitive'
          },
          NOT: {
            id: categoryId
          }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' } as AdminApiResponse,
          { status: 400 }
        )
      }

      updateData.name = body.name
      // Generate new slug when name changes
      updateData.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
    
    if (body.hasOwnProperty('image')) {
      updateData.image = body.image || null
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' } as AdminApiResponse,
        { status: 404 }
      )
    }

    // Update category with only the provided fields
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    } as AdminApiResponse)

  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const categoryId = resolvedParams.id

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' } as AdminApiResponse,
        { status: 404 }
      )
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${existingCategory._count.products} products. Move or delete products first.`
        } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Delete image from Cloudinary before deleting category
    // if (existingCategory.image && existingCategory.image.includes('cloudinary.com')) {
    //   try {
    //     // const { deleteImagesFromUrls } = await import('@/lib/cloudinary-server')
    //     // const deletedCount = await deleteImagesFromUrls([existingCategory.image])
    //     // console.log(`Deleted ${deletedCount} image(s) from Cloudinary for category ${categoryId}`)
    //   } catch (cloudinaryError) {
    //     // Log error but continue with category deletion
    //    // console.error('Failed to delete image from Cloudinary:', cloudinaryError)
    //   }
    // }

    // Hard delete the category
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    } as AdminApiResponse)

  } catch (error) {
    // console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' } as AdminApiResponse,
      { status: 500 }
    )
  }
}