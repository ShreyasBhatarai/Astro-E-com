'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AutoLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const performAutoLogin = async () => {
      const token = searchParams.get('token')
      const email = searchParams.get('email')

      if (!token || !email) {
        setStatus('error')
        setMessage('Invalid login link')
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      try {
        // Verify the token with the backend
        const response = await fetch('/api/auth/verify-auto-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          // Use NextAuth to sign in the user
          const signInResult = await signIn('credentials', {
            email: email,
            password: 'auto-login-bypass', // Special password for auto-login
            autoLogin: 'true',
            redirect: false,
          })

          if (signInResult?.ok) {
            setStatus('success')
            setMessage('Successfully signed in! Redirecting...')
            setTimeout(() => router.push('/'), 1000)
          } else {
            setStatus('error')
            setMessage('Failed to sign in automatically')
            setTimeout(() => router.push('/login'), 3000)
          }
        } else {
          setStatus('error')
          setMessage(result.error || 'Invalid or expired login link')
          setTimeout(() => router.push('/login'), 3000)
        }
      } catch (error) {
        // console.error('Auto-login error:', error)
        setStatus('error')
        setMessage('An error occurred during auto-login')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    performAutoLogin()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-astro-primary" />
              <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
              <p className="text-gray-600">Please wait while we verify your login link.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2 text-green-700">Success!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2 text-red-700">Login Failed</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting to login page...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}