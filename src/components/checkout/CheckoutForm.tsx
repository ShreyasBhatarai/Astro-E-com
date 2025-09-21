'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, User, MapPin } from 'lucide-react'
import Link from 'next/link'

const checkoutSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  province: z.string().min(1, 'Province is required'),
  orderNotes: z.string().optional(),
  paymentMethod: z.literal('COD')
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
  className?: string
}

export function CheckoutForm({ onSubmit, isLoading = false, className }: CheckoutFormProps) {
  const { data: session } = useSession()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'COD'
    }
  })

  const handleFormSubmit = (data: CheckoutFormData) => {
    // Add session data to form data
    const completeData = {
      ...data,
      firstName: session?.user?.name?.split(' ')[0] || '',
      lastName: session?.user?.name?.split(' ').slice(1).join(' ') || '',
      phone: session?.user?.phone || '',
      email: session?.user?.email || ''
    }
    onSubmit(completeData)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-medium">Shipping Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* User Info Display (Read-only) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-normal text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-normal text-gray-700 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Full Name
                </Label>
                <Input
                  value={session?.user?.name || ''}
                  disabled
                  className="bg-gray-50 text-gray-700 cursor-not-allowed font-normal"
                />
              </div>
              <div>
                <Label className="text-sm font-normal text-gray-700 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone Number
                </Label>
                <Input
                  value={session?.user?.phone || 'Not provided'}
                  disabled
                  className="bg-gray-50 text-gray-700 cursor-not-allowed font-normal"
                />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-blue-600 font-normal flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Team will contact for confirmation
              </p>
              <Link 
                href="/profile" 
                className="text-xs text-blue-600 hover:text-blue-700 underline font-normal mt-1 inline-block"
              >
                Change? Update in profile
              </Link>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-normal text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Shipping Address
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">
                Street Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Enter your complete address"
                className="w-full"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="City"
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">
                  District <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="district"
                  {...register('district')}
                  placeholder="District"
                />
                {errors.district && (
                  <p className="text-sm text-red-500">{errors.district.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">
                  Province <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="province"
                  {...register('province')}
                  placeholder="Province"
                />
                {errors.province && (
                  <p className="text-sm text-red-500">{errors.province.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="space-y-2">
            <Label htmlFor="orderNotes" className="font-normal">
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="orderNotes"
              {...register('orderNotes')}
              placeholder="Any special delivery instructions or notes..."
              rows={3}
              className="resize-none font-normal"
            />
            <p className="text-sm text-gray-500 font-normal">
              Let us know if you have any specific delivery preferences.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-astro-primary hover:bg-astro-primary-hover text-white font-normal py-3 text-base"
          >
            {isLoading ? 'Processing...' : 'Place Order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}