import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { AdminApiResponse } from '@/types'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: categories
    } as AdminApiResponse)

  } catch (error) {
    // console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, image, isActive } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        image: image || null,
        isActive: isActive !== undefined ? isActive : true
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
      data: category,
      message: 'Category created successfully'
    } as AdminApiResponse)

  } catch (error) {
    // console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' } as AdminApiResponse,
      { status: 500 }
    )
  }
}