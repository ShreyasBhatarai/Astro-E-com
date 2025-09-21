'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
})

type OTPFormData = z.infer<typeof otpSchema>

export default function VerifyResetOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (!emailParam) {
      router.push('/forgot-password')
      return
    }
    setEmail(emailParam)
  }, [searchParams, router])

  const onSubmit = async (data: OTPFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp: data.otp 
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('OTP verified successfully!')
        // Redirect to password reset page with token
        router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${result.resetToken}`)
      } else {
        setError(result.error || 'Invalid OTP')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('New OTP sent to your email!')
      } else {
        toast.error(result.error || 'Failed to resend OTP')
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Verify OTP</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  {...register('otp')}
                  className={`text-center text-lg tracking-widest ${errors.otp ? 'border-destructive' : ''}`}
                  autoComplete="one-time-code"
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-astro-primary hover:bg-astro-primary-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <button 
                onClick={resendOTP}
                disabled={isLoading}
                className="text-sm text-astro-primary hover:text-astro-primary-hover hover:underline disabled:opacity-50"
              >
                Didn&apos;t receive the code? Resend OTP
              </button>
              
              <Link 
                href="/forgot-password" 
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Email Entry
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}