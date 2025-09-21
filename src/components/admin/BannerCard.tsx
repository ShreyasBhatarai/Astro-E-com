'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Edit, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { BannerKanbanItem } from '@/types'

interface BannerCardProps {
  banner: BannerKanbanItem
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
}

export function BannerCard({ banner, onEdit, onDelete, onToggleStatus }: BannerCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleStatus = async () => {
    setIsLoading(true)
    try {
      await onToggleStatus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    onEdit()
  }

  const handleDelete = () => {
    onDelete()
  }

  const handlePreview = () => {
    window.open(banner.redirectUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      {/* Banner Image */}
      <div className="flex-shrink-0 w-20 h-16 relative rounded-md overflow-hidden bg-muted">
        <Image
          src={banner.image}
          alt={`Banner ${banner.position}`}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Banner Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={banner.isActive ? 'default' : 'secondary'} className="text-xs">
            {banner.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Position #{banner.position}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {banner.redirectUrl}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          Created {new Date(banner.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Status Toggle */}
        <div className="flex items-center gap-2">
          {banner.isActive ? (
            <Eye className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Switch
            checked={banner.isActive}
            onCheckedChange={handleToggleStatus}
            disabled={isLoading}
          />
        </div>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handlePreview} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Preview Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Banner
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete} 
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete Banner
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}