import { NextRequest } from 'next/server'

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitData {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const store = new Map<string, RateLimitData>()

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of store.entries()) {
    if (now > data.resetTime) {
      store.delete(key)
    }
  }
}, 60000) // Cleanup every minute

export function rateLimit(options: RateLimitOptions) {
  const { maxRequests, windowMs, keyGenerator } = options

  return async function rateLimitMiddleware(req: NextRequest) {
    // Generate key for rate limiting (IP + User Agent by default)
    const key = keyGenerator 
      ? keyGenerator(req) 
      : `${getClientIP(req)}-${req.headers.get('user-agent') || 'unknown'}`

    const now = Date.now()
    const resetTime = now + windowMs

    // Get or create rate limit data
    let data = store.get(key)
    
    if (!data || now > data.resetTime) {
      // Reset window
      data = { count: 1, resetTime }
      store.set(key, data)
      return { success: true, remaining: maxRequests - 1, resetTime }
    }

    if (data.count >= maxRequests) {
      // Rate limit exceeded
      return { 
        success: false, 
        remaining: 0, 
        resetTime: data.resetTime,
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      }
    }

    // Increment count
    data.count++
    store.set(key, data)

    return { 
      success: true, 
      remaining: maxRequests - data.count, 
      resetTime: data.resetTime 
    }
  }
}

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const clientIP = req.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (clientIP) {
    return clientIP
  }
  
  // Fallback to unknown IP
  return 'unknown'
}

// Predefined rate limiters for different API types
export const createApiRateLimit = () => rateLimit({
  maxRequests: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
})

export const createAuthRateLimit = () => rateLimit({
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
  keyGenerator: (req) => {
    // For auth routes, use IP + email/username if available
    const body = req.body as any
    const identifier = body?.email || body?.username || getClientIP(req)
    return `auth-${identifier}`
  }
})

export const createStrictRateLimit = () => rateLimit({
  maxRequests: 10, // 10 requests
  windowMs: 60 * 1000, // per minute
})

export const createSearchRateLimit = () => rateLimit({
  maxRequests: 30, // 30 searches
  windowMs: 60 * 1000, // per minute
})