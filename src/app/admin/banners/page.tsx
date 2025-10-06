'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BannerKanban } from '@/components/admin/BannerKanban'
import { BannerDialog } from '@/components/admin/BannerDialog'
import { BannerKanbanItem, CreateBannerData, UpdateBannerData, AdminBannerDto } from '@/types'
import { toast } from 'sonner'

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerKanbanItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerKanbanItem | null>(null)

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/banners')
      const data = await response.json()
      
      if (data.success) {
        setBanners(data.data.map((b: AdminBannerDto) => ({ 
          ...b, 
          createdAt: new Date(b.createdAt), 
          updatedAt: new Date(b.updatedAt) 
        })))
      } else {
        toast.error(data.error || 'Failed to fetch banners')
      }
    } catch (error) {
      // console.error('Error fetching banners:', error)
      toast.error('Failed to fetch banners')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  // Handle banner creation
  const handleCreateBanner = async (data: CreateBannerData | UpdateBannerData) => {
    try {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Banner created successfully')
        await fetchBanners()
        setIsDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to create banner')
      }
    } catch (error) {
      // console.error('Error creating banner:', error)
      toast.error('Failed to create banner')
    }
  }

  // Handle banner update
  const handleUpdateBanner = async (id: string, data: CreateBannerData | UpdateBannerData) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Banner updated successfully')
        await fetchBanners()
        setEditingBanner(null)
      } else {
        toast.error(result.error || 'Failed to update banner')
      }
    } catch (error) {
      // console.error('Error updating banner:', error)
      toast.error('Failed to update banner')
    }
  }

  // Handle banner deletion
  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Banner deleted successfully')
        await fetchBanners()
      } else {
        toast.error(result.error || 'Failed to delete banner')
      }
    } catch (error) {
      // console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  // Handle banner status toggle
  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: null }), // Special value to trigger toggle
      })

      const result = await response.json()
      
      if (result.success) {
        const banner = banners.find(b => b.id === id)
        const newStatus = !banner?.isActive
        toast.success(
          `Banner ${newStatus ? 'activated' : 'deactivated'} successfully`,
          {
            description: `The banner is now ${newStatus ? 'visible' : 'hidden'} on the website`,
            duration: 3000
          }
        )
        await fetchBanners()
      } else {
        toast.error(result.error || 'Failed to update banner status')
      }
    } catch (error) {
      // console.error('Error toggling banner status:', error)
      toast.error('Failed to update banner status')
    }
  }

  // Handle banner reordering
  const handleReorderBanners = async (reorderedBanners: BannerKanbanItem[]) => {
    try {
      const positionUpdates = reorderedBanners.map((banner, index) => ({
        id: banner.id,
        position: index + 1
      }))

      const response = await fetch('/api/admin/banners/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ banners: positionUpdates }),
      })

      const result = await response.json()
      
      if (result.success) {
        setBanners(reorderedBanners)
        toast.success('Banner order updated')
      } else {
        toast.error(result.error || 'Failed to update banner order')
        await fetchBanners() // Revert on error
      }
    } catch (error) {
      // console.error('Error reordering banners:', error)
      toast.error('Failed to update banner order')
      await fetchBanners() // Revert on error
    }
  }

  // Handle edit banner
  const handleEditBanner = (banner: BannerKanbanItem) => {
    setEditingBanner(banner)
    setIsDialogOpen(true)
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingBanner(null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading banners...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 ">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banner Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your store banners with drag-and-drop positioning
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No banners yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first banner to get started with your store's promotional content.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <BannerKanban
          banners={banners}
          onReorder={handleReorderBanners}
          onEdit={handleEditBanner}
          onDelete={handleDeleteBanner}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <BannerDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={editingBanner ? (data) => handleUpdateBanner(editingBanner.id, data) : handleCreateBanner}
        banner={editingBanner}
        title={editingBanner ? 'Edit Banner' : 'Create New Banner'}
      />
    </div>
  )
}