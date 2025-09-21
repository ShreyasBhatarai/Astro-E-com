'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CloudinaryImageUpload } from '@/components/ui/CloudinaryImageUpload'
import { BannerKanbanItem, CreateBannerData, UpdateBannerData } from '@/types'

const bannerSchema = z.object({
  image: z.string().min(1, 'Image is required'),
  redirectUrl: z.string().url('Please enter a valid URL'),
})

type BannerFormData = z.infer<typeof bannerSchema>

interface BannerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBannerData | UpdateBannerData) => Promise<void>
  banner?: BannerKanbanItem | null
  title: string
}

export function BannerDialog({
  isOpen,
  onClose,
  onSubmit,
  banner,
  title
}: BannerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      image: '',
      redirectUrl: ''
    }
  })


  // Reset form when dialog opens/closes or banner changes
  useEffect(() => {
    if (isOpen) {
      if (banner) {
        // Edit mode
        reset({
          image: banner.image,
          redirectUrl: banner.redirectUrl
        })
        setUploadedImageUrl(banner.image)
      } else {
        // Create mode
        reset({
          image: '',
          redirectUrl: ''
        })
        setUploadedImageUrl('')
      }
    } else {
      reset()
    }
  }, [isOpen, banner, reset])

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setUploadedImageUrl(url)
    setValue('image', url)
  }

  const handleFormSubmit = async (data: BannerFormData) => {
    setIsSubmitting(true)
    try {
      // Add isActive as false by default as per requirements
      await onSubmit({ ...data, isActive: false })
    } catch (error) {
      // console.error('Error submitting banner:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSubmitting) onClose() }}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {banner ? 'Update your banner information' : 'Create a new banner for your store'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Horizontal Layout: Image Upload (left), Redirect URL (center), Buttons (right) */}
          <div className=" gap-6 items-start">
            
            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Banner Image *</Label>
              <CloudinaryImageUpload
                images={uploadedImageUrl ? [uploadedImageUrl] : []}
                onImagesChange={(images) => handleImageUpload(images[0] || '')}
                maxImages={1}
                folder="banners"
                className="w-full"
              />
              {errors.image && (
                <p className="text-sm text-destructive">{errors.image.message}</p>
              )}
            </div>

            {/*  Redirect URL */}
            <div className="space-y-3">
              <Label htmlFor="redirectUrl" className="text-sm font-medium">Redirect URL *</Label>
              <Input
                id="redirectUrl"
                type="url"
                placeholder="https://example.com"
                {...register('redirectUrl')}
                className={errors.redirectUrl ? 'border-destructive' : ''}
              />
              {errors.redirectUrl && (
                <p className="text-sm text-destructive">{errors.redirectUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Users will be redirected to this URL when they click the banner
              </p>
            </div>

            {/*  Action Buttons */}
            <div className="flex flex-col gap-3 lg:pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || !uploadedImageUrl}
                className="w-full bg-astro-primary hover:bg-astro-primary-hover"
              >
                {isSubmitting ? 'Creating...' : (banner ? 'Update Banner' : 'Create Banner')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                disabled={isSubmitting}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}