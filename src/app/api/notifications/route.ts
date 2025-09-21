import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const countOnly = searchParams.get('countOnly') === 'true'
    const skip = (page - 1) * limit

    // If only unread count is requested
    if (countOnly) {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false
        }
      })
      
      return NextResponse.json({
        success: true,
        unreadCount
      })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const totalCount = await prisma.notification.count({
      where: {
        userId: session.user.id
      }
    })

    const hasMore = skip + notifications.length < totalCount

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore
      }
    })
  } catch (error) {
    // console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, type, title, message, metadata } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata || null,
        emailSent: false
      }
    })

    // TODO: Implement email sending here if sendEmail is true

    return NextResponse.json({
      success: true,
      data: notification
    })
  } catch (error) {
    // console.error('Error creating notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, isRead } = body

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid notification IDs' },
        { status: 400 }
      )
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id
      },
      data: {
        isRead: isRead ?? true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notifications updated'
    })
  } catch (error) {
    // console.error('Error updating notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}