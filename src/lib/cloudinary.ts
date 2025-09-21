// Note: Do NOT import the Cloudinary SDK in the browser to avoid fs/path issues.
// All client uploads are done via fetch to the unsigned upload endpoint.

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface CloudinaryUploadOptions {
  folder?: string
  transformation?: any
  public_id?: string
  overwrite?: boolean
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
}

/**
 * Upload a file to Cloudinary
 * @param file - File to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '')
  
  // Add folder if specified
  if (options.folder) {
    formData.append('folder', options.folder)
  }
  
  // Add public_id if specified
  if (options.public_id) {
    formData.append('public_id', options.public_id)
  }
  
  // Add overwrite option
  if (options.overwrite !== undefined) {
    formData.append('overwrite', options.overwrite.toString())
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Upload failed')
    }

    const result = await response.json()
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    // console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error('Failed to delete image')
    }

    return true
  } catch (error) {
    // console.error('Cloudinary delete error:', error)
    return false
  }
}

/**
 * Generate a Cloudinary URL with transformations
 * @param publicId - Public ID of the image
 * @param transformations - Cloudinary transformations
 * @returns Transformed image URL
 */
export function getCloudinaryUrl(publicId: string, transformations: Record<string, string | number> = {}): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(transformations)) {
    params.append(key, String(value))
  }
  const trans = Object.keys(transformations).length > 0 ? `/${Object.entries(transformations).map(([k,v]) => `${k}_${v}`).join(',')}` : ''
  return `https://res.cloudinary.com/${cloudName}/image/upload${trans}/${publicId}.jpg`
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if not a Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  const cloudinaryRegex = /cloudinary\.com\/.*\/upload\/.*\/([^\/]+)\./
  const match = url.match(cloudinaryRegex)
  return match ? match[1] : null
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of files to upload
 * @param options - Upload options
 * @param onProgress - Progress callback
 * @returns Promise with array of upload results
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  options: CloudinaryUploadOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadToCloudinary(files[i], options)
      results.push(result)
      onProgress?.(i + 1, files.length)
    } catch (error) {
      // console.error(`Failed to upload file ${files[i].name}:`, error)
      throw error
    }
  }
  
  return results
}