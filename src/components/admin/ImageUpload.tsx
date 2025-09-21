'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react'
import Image from 'next/image'
import { compressImage, validateImageFile } from '@/lib/utils'
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from '@/lib/cloudinary'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    
    // Validate files first
    const validationResults = fileArray.map(file => ({ file, isValid: validateImageFile(file) }))

    const invalidFiles = validationResults.filter(result => !result.isValid)
    const validFiles = validationResults.filter(result => result.isValid).map(result => result.file)

    // Show errors for invalid files
    invalidFiles.forEach(({ file }) => {
      toast.error(`${file.name}: Invalid image file`)
    })

    if (validFiles.length === 0) return

    if (images.length + validFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    setIsUploading(true)
    try {
      const uploadedUrls: string[] = []
      
      // Process and upload each valid file
      for (const file of validFiles) {
        setCompressionProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        try {
          // Compress the image first
          setCompressionProgress(prev => ({ ...prev, [file.name]: 25 }))
          const compressedFile = await compressImage(file, 800, 0.8)
          
          // Upload to Cloudinary
          setCompressionProgress(prev => ({ ...prev, [file.name]: 50 }))
          const uploadResult = await uploadToCloudinary(compressedFile, {
            folder: 'products',
            transformation: {
              quality: 'auto',
              fetch_format: 'auto',
            }
          })
          
          setCompressionProgress(prev => ({ ...prev, [file.name]: 100 }))
          uploadedUrls.push(uploadResult.secure_url)
          
        } catch (error) {
          // console.error(`Error processing ${file.name}:`, error)
          toast.error(`Failed to upload ${file.name}`)
          // Continue with other files
        }
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      // console.error('Error processing images:', error)
      toast.error('Failed to process images')
    } finally {
      setIsUploading(false)
      setCompressionProgress({})
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeImage = async (index: number) => {
    const imageToRemove = images[index]
    
    // If it's a Cloudinary URL, delete it from Cloudinary
    if (imageToRemove.includes('cloudinary.com')) {
      const publicId = extractPublicIdFromUrl(imageToRemove)
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId)
          toast.success('Image deleted from storage')
        } catch (error) {
          // console.error('Failed to delete image from Cloudinary:', error)
          toast.error('Failed to delete image from storage')
        }
      }
    }
    
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  // const reorderImages = (fromIndex: number, toIndex: number) => {
  //   const newImages = [...images]
  //   const [removed] = newImages.splice(fromIndex, 1)
  //   newImages.splice(toIndex, 0, removed)
  //   onImagesChange(newImages)
  // }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Product Images
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
                {isUploading ? 'Processing...' : 'Select Images'}
              </Button>
              
              {/* Upload Progress */}
              {isUploading && Object.keys(compressionProgress).length > 0 && (
                <div className="mt-4 space-y-2">
                  {Object.entries(compressionProgress).map(([filename, progress]) => (
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
                        {progress < 25 && 'Compressing...'}
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
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
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
                    variant="secondary"
                    onClick={() => removeImage(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
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
      {images.length > 0 && images.length < maxImages && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add More Images ({images.length}/{maxImages})
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Image count */}
      <div className="text-sm text-gray-600 text-center">
        {images.length} of {maxImages} images uploaded
      </div>
    </div>
  )
}