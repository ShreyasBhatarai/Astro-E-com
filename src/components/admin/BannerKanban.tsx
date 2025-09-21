'use client'

import { useState } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BannerKanbanItem } from '@/types'
import { BannerCard } from './BannerCard'

interface BannerKanbanProps {
  banners: BannerKanbanItem[]
  onReorder: (banners: BannerKanbanItem[]) => void
  onEdit: (banner: BannerKanbanItem) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function BannerKanban({
  banners,
  onReorder,
  onEdit,
  onDelete,
  onToggleStatus
}: BannerKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, bannerId: string) => {
    setDraggedItem(bannerId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', bannerId)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const draggedBannerId = e.dataTransfer.getData('text/plain')
    
    if (!draggedBannerId || draggedBannerId === banners[dropIndex]?.id) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    const draggedIndex = banners.findIndex(banner => banner.id === draggedBannerId)
    if (draggedIndex === -1) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    // Create new array with reordered banners
    const newBanners = [...banners]
    const [draggedBanner] = newBanners.splice(draggedIndex, 1)
    newBanners.splice(dropIndex, 0, draggedBanner)

    // Update positions
    const reorderedBanners = newBanners.map((banner, index) => ({
      ...banner,
      position: index + 1
    }))

    onReorder(reorderedBanners)
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  // Touch events for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, bannerId: string) => {
    setDraggedItem(bannerId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedItem) return
    
    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const bannerCard = element?.closest('[data-banner-id]')
    
    if (bannerCard) {
      const bannerId = bannerCard.getAttribute('data-banner-id')
      const index = banners.findIndex(banner => banner.id === bannerId)
      if (index !== -1) {
        setDragOverIndex(index)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedItem) return
    
    const touch = e.changedTouches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const bannerCard = element?.closest('[data-banner-id]')
    
    if (bannerCard) {
      const bannerId = bannerCard.getAttribute('data-banner-id')
      const dropIndex = banners.findIndex(banner => banner.id === bannerId)
      
      if (dropIndex !== -1 && bannerId !== draggedItem) {
        const draggedIndex = banners.findIndex(banner => banner.id === draggedItem)
        
        const newBanners = [...banners]
        const [draggedBanner] = newBanners.splice(draggedIndex, 1)
        newBanners.splice(dropIndex, 0, draggedBanner)

        const reorderedBanners = newBanners.map((banner, index) => ({
          ...banner,
          position: index + 1
        }))

        onReorder(reorderedBanners)
      }
    }
    
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* Kanban Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Banner Order</h2>
          <Badge variant="secondary" className="text-sm">
            {banners.length} banner{banners.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Drag and drop to reorder banners
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            data-banner-id={banner.id}
            className={`relative transition-all duration-200 ${
              draggedItem === banner.id ? 'opacity-50 scale-95' : ''
            } ${
              dragOverIndex === index && draggedItem !== banner.id
                ? 'ring-2 ring-primary ring-offset-2'
                : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, banner.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, banner.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 cursor-move text-muted-foreground hover:text-foreground transition-colors">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Position Indicator */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {banner.position}
                  </div>

                  {/* Banner Card */}
                  <div className="flex-1">
                    <BannerCard
                      banner={banner}
                      onEdit={() => onEdit(banner)}
                      onDelete={() => onDelete(banner.id)}
                      onToggleStatus={() => onToggleStatus(banner.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {banners.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No banners to display</h3>
              <p className="text-muted-foreground">
                Create your first banner to get started with the Kanban view.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}