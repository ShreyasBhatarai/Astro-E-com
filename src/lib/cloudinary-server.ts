import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if not a Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null
  }

  try {
    // Handle different Cloudinary URL formats
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
    // Or: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/
    const match = url.match(regex)
    
    if (match && match[1]) {
      // Remove file extension if present
      return match[1].replace(/\.[^.]+$/, '')
    }
    
    return null
  } catch (error) {
    console.error('Error extracting public ID from URL:', error)
    return null
  }
}

/**
 * Delete an image from Cloudinary (server-side)
 * @param publicId - Public ID of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinaryServer(publicId: string): Promise<boolean> {
  try {
    if (!publicId) {
      return false
    }

    const result = await cloudinary.uploader.destroy(publicId)
    
    if (result.result === 'ok' || result.result === 'not found') {
      // 'not found' is also considered success (already deleted)
      return true
    }
    
    console.error('Cloudinary deletion failed:', result)
    return false
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}

/**
 * Delete multiple images from Cloudinary (server-side)
 * @param publicIds - Array of public IDs to delete
 * @returns Promise with array of deletion results
 */
export async function deleteMultipleFromCloudinaryServer(publicIds: string[]): Promise<boolean[]> {
  const results = await Promise.allSettled(
    publicIds.map(publicId => deleteFromCloudinaryServer(publicId))
  )
  
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : false
  )
}

/**
 * Delete images from URLs (extracts public IDs and deletes)
 * @param urls - Array of Cloudinary URLs
 * @returns Promise with number of successfully deleted images
 */
export async function deleteImagesFromUrls(urls: string[]): Promise<number> {
  if (!urls || urls.length === 0) {
    return 0
  }

  const cloudinaryUrls = urls.filter(url => url && url.includes('cloudinary.com'))
  
  if (cloudinaryUrls.length === 0) {
    return 0
  }

  const publicIds = cloudinaryUrls
    .map(url => extractPublicIdFromUrl(url))
    .filter((id): id is string => id !== null)

  if (publicIds.length === 0) {
    return 0
  }

  const results = await deleteMultipleFromCloudinaryServer(publicIds)
  const successCount = results.filter(result => result === true).length

  return successCount
}

