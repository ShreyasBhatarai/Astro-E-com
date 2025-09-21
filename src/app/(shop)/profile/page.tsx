'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { PageLoader } from '@/components/ui/loader'

// Schema for profile update
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
})

// Schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (session?.user) {
      profileForm.reset({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
      })
    }
  }, [session, profileForm])

  if (status === 'loading') {
    return (
      <div className="container py-8">
        <PageLoader text="Loading profile..." />
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  // Admin users can also access their profile page
  // Removed the admin redirect to allow admin users to manage their personal profile

  const handleProfileSave = async (data: ProfileFormData) => {
    setIsSavingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) throw new Error('Failed to update profile')
      
      toast.success('Profile updated successfully!')
    } catch (error) {
      // console.error('Profile update error:', error)
      toast.error('Could not update profile. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordChange = async (data: PasswordFormData) => {
    setIsSavingPassword(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to update password')
      }
      
      toast.success('Password updated successfully!')
      passwordForm.reset()
    } catch (error: any) {
      // console.error('Password update error:', error)
      toast.error(error.message || 'Could not update password. Please try again.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-astro-gray-900">My Profile</h1>
        <p className="text-astro-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-astro-primary" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...profileForm.register('name')}
                  className={profileForm.formState.errors.name ? 'border-destructive' : ''}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...profileForm.register('email')}
                  className={profileForm.formState.errors.email ? 'border-destructive' : ''}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  {...profileForm.register('phone')}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSavingProfile}
                className="w-full bg-astro-primary hover:bg-astro-primary-hover"
              >
                {isSavingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-astro-primary" />
              Change Password
            </CardTitle>
        </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    {...passwordForm.register('currentPassword')}
                    className={passwordForm.formState.errors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    {...passwordForm.register('newPassword')}
                    className={passwordForm.formState.errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
          </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    {...passwordForm.register('confirmPassword')}
                    className={passwordForm.formState.errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
          </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
          </div>

              <Button 
                type="submit" 
                disabled={isSavingPassword}
                className="w-full bg-astro-primary hover:bg-astro-primary-hover"
              >
                {isSavingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

