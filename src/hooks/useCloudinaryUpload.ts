import { useState, useCallback } from 'react'
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from '@/lib/cloudinary'
import { toast } from 'sonner'

interface UploadProgress {
  [filename: string]: number
}

interface UseCloudinaryUploadOptions {
  folder?: string
  maxFiles?: number
  onUploadComplete?: (urls: string[]) => void
  onUploadError?: (error: string) => void
}

export function useCloudinaryUpload(options: UseCloudinaryUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({})
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return []

    const { folder = 'uploads', maxFiles = 5, onUploadComplete, onUploadError } = options

    if (files.length > maxFiles) {
      const error = `Maximum ${maxFiles} files allowed`
      toast.error(error)
      onUploadError?.(error)
      return []
    }

    setIsUploading(true)
    setUploadProgress({})
    
    try {
      const results: string[] = []
      
      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        try {
          // Simulate progress for compression
          setUploadProgress(prev => ({ ...prev, [file.name]: 25 }))
          
          // Upload to Cloudinary
          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }))
          
          const uploadResult = await uploadToCloudinary(file, {
            folder,
            transformation: {
              quality: 'auto',
              fetch_format: 'auto',
            }
          })
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          results.push(uploadResult.secure_url)
          
        } catch (error) {
          // console.error(`Failed to upload ${file.name}:`, error)
          toast.error(`Failed to upload ${file.name}`)
          onUploadError?.(`Failed to upload ${file.name}`)
        }
      }

      if (results.length > 0) {
        setUploadedUrls(prev => [...prev, ...results])
        onUploadComplete?.(results)
        toast.success(`${results.length} file(s) uploaded successfully`)
      }

      return results
    } catch (error) {
      // console.error('Upload error:', error)
      const errorMessage = 'Failed to upload files'
      toast.error(errorMessage)
      onUploadError?.(errorMessage)
      return []
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }, [options])

  const deleteFile = useCallback(async (url: string) => {
    if (url.includes('cloudinary.com')) {
      const publicId = extractPublicIdFromUrl(url)
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId)
          setUploadedUrls(prev => prev.filter(u => u !== url))
          toast.success('File deleted successfully')
          return true
        } catch (error) {
          // console.error('Failed to delete file:', error)
          toast.error('Failed to delete file')
          return false
        }
      }
    }
    return false
  }, [])

  const clearUploads = useCallback(() => {
    setUploadedUrls([])
    setUploadProgress({})
  }, [])

  const reset = useCallback(() => {
    setIsUploading(false)
    setUploadProgress({})
    setUploadedUrls([])
  }, [])

  return {
    isUploading,
    uploadProgress,
    uploadedUrls,
    uploadFiles,
    deleteFile,
    clearUploads,
    reset,
  }
}