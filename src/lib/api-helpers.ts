import { NextRequest, NextResponse } from 'next/server'

export async function withRateLimit(
  req: NextRequest,
  rateLimitFn: (req: NextRequest) => Promise<any>,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const rateLimitResult = await rateLimitFn(req)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = await handler()
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    
    return response
  } catch (error) {
    // console.error('Rate limiting error:', error)
    // If rate limiting fails, continue with the request
    return handler()
  }
}