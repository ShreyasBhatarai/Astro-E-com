'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Notification } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  page: number
  fetchNotifications: (page?: number) => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: (notificationIds: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  redirectToPage: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchNotifications = useCallback(async (targetPage = 1) => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/notifications?page=${targetPage}&limit=7`)
      if (response.ok) {
        const data = await response.json()
        if (targetPage === 1) {
          setNotifications(data.data)
        } else {
          setNotifications(prev => [...prev, ...data.data])
        }
        setHasMore(data.pagination.hasMore)
        setPage(targetPage)
        
        // Update unread count
        const unread = data.data.filter((n: Notification) => !n.isRead).length
        if (targetPage === 1) {
          setUnreadCount(unread)
        }
      }
    } catch (error) {
      // console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchNotifications(page + 1)
  }, [hasMore, isLoading, page, fetchNotifications])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          isRead: true,
        }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      // console.error('Error marking notifications as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }, [notifications, markAsRead])

  const refreshNotifications = useCallback(async () => {
    setPage(1)
    await fetchNotifications(1)
  }, [fetchNotifications])

  const redirectToPage = useCallback((notification: Notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead([notification.id])
    }

    // Handle different notification types
    const metadata = notification.metadata as any
    switch (notification.type) {
      case 'ORDER_CREATED':
      case 'ORDER_STATUS_CHANGED':
        if (metadata?.orderNumber) {
          router.push(`/orders/${metadata.orderNumber}`)
        } else {
          router.push('/orders')
        }
        break
      case 'ORDER_STATUS_CHANGED':
        router.push('/profile')
        break
      default:
        // Don't navigate for unknown types
        break
    }
  }, [router, markAsRead])

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications?countOnly=true')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      // Silently fail - unread count is not critical
    }
  }, [session?.user?.id])

  // Fetch unread count on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount()
    } else {
      setUnreadCount(0)
      setNotifications([])
    }
  }, [session?.user?.id, fetchUnreadCount])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        page,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        redirectToPage,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}