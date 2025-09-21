'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
})

type OtpFormData = z.infer<typeof otpSchema>

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  const otpValue = watch('otp') || ''

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // Auto-redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/register')
    }
  }, [email, router])

  const onSubmit = async (data: OtpFormData) => {
    if (!email) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: data.otp,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed')
      }

      setSuccess('Email verified successfully!')
      toast.success('Email verified successfully!')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?message=verified')
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email || cooldown > 0) return

    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP')
      }

      toast.success('Verification code sent!')
      setCooldown(60) // 60 second cooldown
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link 
            href="/register" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to registration
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a 6-digit verification code to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  {...register('otp')}
                  disabled={isLoading}
                  className={`text-center text-xl tracking-widest font-mono ${
                    errors.otp ? 'border-destructive' : ''
                  }`}
                  autoComplete="one-time-code"
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || otpValue.length !== 6}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center flex">
              <p className="text-sm text-muted-foreground mb-4">
                Didn&apos;t receive the code?
              </p>
              <Button
                variant="link"
                onClick={handleResendOtp}
                disabled={isResending || cooldown > 0}
                className="text-sm -mt-2 !px-1"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  'Resend'
                )}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                The verification code will expire in 10 minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}