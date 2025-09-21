import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orderUpdateEmitter, generateConnectionId, startHeartbeat } from '@/lib/realtime'

// GET /api/admin/orders/realtime - Server-Sent Events endpoint for real-time order updates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return new Response('Unauthorized', { status: 401 })
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const connectionId = generateConnectionId()
        const emitter = orderUpdateEmitter

        // Add connection
        emitter.addConnection(connectionId, session.user.id)
        
        // Register controller for broadcasting
        emitter.registerController(connectionId, controller, session.user.id)

        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connection_established',
          connectionId,
          timestamp: new Date().toISOString()
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(initialMessage))

        // Set up heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeatMessage = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`
            controller.enqueue(new TextEncoder().encode(heartbeatMessage))
            emitter.updatePing(connectionId)
          } catch (error) {
            // console.error('Error sending heartbeat:', error)
            clearInterval(heartbeatInterval)
            controller.close()
          }
        }, 30000) // 30 seconds

        // Store cleanup function
        const cleanup = () => {
          clearInterval(heartbeatInterval)
          emitter.removeConnection(connectionId)
          controller.close()
        }

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup)

        // Store controller for potential future use
        ;(controller as any).cleanup = cleanup
      },
      cancel() {
        // Cleanup when client disconnects
        // SSE connection cancelled
      }
    })

    // Start global heartbeat if not already started
    if (!global.heartbeatInterval) {
      global.heartbeatInterval = startHeartbeat(30000)
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    // console.error('Error setting up SSE connection:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Global heartbeat interval (to prevent multiple instances)
declare global {
  var heartbeatInterval: NodeJS.Timeout | undefined
}