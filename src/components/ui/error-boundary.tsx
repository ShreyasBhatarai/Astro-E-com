'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-destructive">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Database Connection Error Component
export function DatabaseConnectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-amber-500">
            <AlertTriangle className="h-full w-full" />
          </div>
          <CardTitle className="text-xl">Database Connection Issue</CardTitle>
          <CardDescription>
            Unable to connect to the database. Please check your internet connection and try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            If the problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}