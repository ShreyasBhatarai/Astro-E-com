import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to perform a simple database query
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // console.error('Database health check failed:', error)
    
    let errorMessage = 'Database connection failed'
    
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json({
      success: false,
      connected: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}