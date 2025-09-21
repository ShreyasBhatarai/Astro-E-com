'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { validateImageFile } from '@/lib/utils'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'

interface CloudinaryImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  folder?: string
  className?: string
}

export function CloudinaryImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  folder = 'uploads',
  className = ''
}: CloudinaryImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { isUploading, uploadProgress, uploadFiles, deleteFile } = useCloudinaryUpload({
    folder,
    maxFiles: maxImages - (images?.length || 0),
    onUploadComplete: (urls) => {
      onImagesChange([...(images || []), ...urls])
    },
    onUploadError: (error) => {
      // console.error('Upload error:', error)
    }
  })

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    
    // Validate files first
    const validationResults = fileArray.map(file => ({
      file,
      validation: validateImageFile(file)
    }))

    const invalidFiles = validationResults.filter(result => !result.validation)
    const validFiles = validationResults.filter(result => result.validation).map(result => result.file)

    // Show errors for invalid files
    invalidFiles.forEach(({ file }) => {
      toast.error(`${file.name}: Invalid file`)
    })

    if (validFiles.length === 0) return

    if ((images?.length || 0) + validFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    await uploadFiles(validFiles)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleRemoveImage = async (index: number) => {
    if (!images || !images[index]) return
    
    const imageToRemove = images[index]
    
    // Try to delete from Cloudinary first
    if (imageToRemove.includes('cloudinary.com')) {
      await deleteFile(imageToRemove)
    }
    
    // Remove from local state
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {(images?.length || 0) < maxImages && (
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Images
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop images here, or click to select files
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Maximum {maxImages} images, 5MB each. Supported formats: JPG, PNG, WebP
                <br />
                Images will be automatically optimized and stored in the cloud
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Select Images'}
              </Button>
              
              {/* Upload Progress */}
              {isUploading && Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(uploadProgress).map(([filename, progress]) => (
                    <div key={filename} className="text-sm">
                      <div className="flex justify-between text-gray-600 mb-1">
                        <span className="truncate">{filename}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {progress < 25 && 'Preparing...'}
                        {progress >= 25 && progress < 50 && 'Uploading to cloud...'}
                        {progress >= 50 && progress < 100 && 'Processing...'}
                        {progress === 100 && 'Complete!'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Grid */}
      {(images?.length || 0) > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={image}
                  alt={`Uploaded image ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveImage(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image number badge */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* Primary image indicator */}
              {index === 0 && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload more button */}
      {(images?.length || 0) > 0 && (images?.length || 0) < maxImages && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add More Images ({images?.length || 0}/{maxImages})
          </Button>
        </div>
      )}

      {/* Image count */}
      <div className="text-sm text-gray-600 text-center">
        {images?.length || 0} of {maxImages} images uploaded
      </div>
    </div>
  )
}