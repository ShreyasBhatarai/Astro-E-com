import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
  }).format(amount).replace('NPR', 'Rs.')
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `ORD-${timestamp}-${random}`.toUpperCase()
}

export function validateNepalPhone(phone: string): boolean {
  // Exactly 10 digits validation (e.g., 9812345678)
  const cleanPhone = phone.replace(/[^\d]/g, '') // Remove all non-digits
  return cleanPhone.length === 10 && /^\d{10}$/.test(cleanPhone)
}

export function validateOrderStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Align transitions with our OrderStatus enum in prisma/schema.prisma
  const validTransitions: Record<string, string[]> = {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['PACKAGED', 'CANCELLED', 'FAILED'],
    PACKAGED: ['SHIPPED', 'CANCELLED', 'FAILED'],
    SHIPPED: ['DELIVERED', 'FAILED'],
    DELIVERED: [],
    CANCELLED: [],
    FAILED: []
  }

  return validTransitions[currentStatus]?.includes(newStatus) || false
}

export function generateSlug(text: string): string {
  return text.toLowerCase().replace(/ /g, '-')
}

export function compressImage(file: File, maxDimension: number = 1024, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        const maxWidth = maxDimension
        const maxHeight = maxDimension
        let width = img.width
        let height = img.height 

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width))
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height))
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          const compressedFile = new File([blob], file.name, { type: file.type })
          resolve(compressedFile)
        }, file.type, quality)
      }
      img.src = reader.result as string
    }
    reader.onerror = () => {
      reject(new Error('Failed to read image'))
    }
    reader.readAsDataURL(file)
  })
}

export function validateImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}