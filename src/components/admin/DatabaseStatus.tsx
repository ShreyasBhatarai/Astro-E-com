'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface DatabaseStatus {
  isConnected: boolean
  error?: string
  lastChecked: Date
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    isConnected: false,
    lastChecked: new Date()
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkDatabaseConnection = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/health/database')
      const data = await response.json()
      
      setStatus({
        isConnected: data.success && data.connected,
        error: data.success ? undefined : data.error,
        lastChecked: new Date()
      })
    } catch (error) {
      setStatus({
        isConnected: false,
        error: 'Failed to check database connection',
        lastChecked: new Date()
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDatabaseConnection()
    
    // Check every 30 seconds
    const interval = setInterval(checkDatabaseConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    
    if (status.isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = () => {
    if (isChecking) {
      return <Badge variant="secondary">Checking...</Badge>
    }
    
    if (status.isConnected) {
      return <Badge variant="default" className="bg-green-500">Connected</Badge>
    }
    
    return <Badge variant="destructive">Disconnected</Badge>
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Database Status</CardTitle>
        {getStatusIcon()}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <Button
            variant="outline"
            size="sm"
            onClick={checkDatabaseConnection}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
        
        {status.error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">Connection Error</p>
                <p className="text-xs text-red-600 mt-1">{status.error}</p>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-2">
          Last checked: {status.lastChecked.toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  )
}