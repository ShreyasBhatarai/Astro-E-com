'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface ShippingUpdateFormProps {
  orderId: string
  initialShippingCost: number
  initialShippingAddress: string
  initialShippingCity: string
  initialShippingDistrict: string
  initialShippingProvince: string

}

export function ShippingUpdateForm({ 
  orderId, 
  initialShippingCost, 
  initialShippingAddress,
  initialShippingCity,
  initialShippingDistrict,
  initialShippingProvince,
}: ShippingUpdateFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    shippingCost: initialShippingCost,
    shippingAddress: initialShippingAddress,
    shippingCity: initialShippingCity,
    shippingDistrict: initialShippingDistrict,
    shippingProvince: initialShippingProvince,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update shipping information')
      }

      const result = await response.json()
      if (result.success) {
        toast.success('Shipping information updated successfully')
        setIsEditing(false)
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to update shipping information')
      }
    } catch (error) {
      // console.error('Error updating shipping information:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update shipping information')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      shippingCost: initialShippingCost,
      shippingAddress: initialShippingAddress,
      shippingCity: initialShippingCity,
      shippingDistrict: initialShippingDistrict,
      shippingProvince: initialShippingProvince,
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shipping Information</CardTitle>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="shippingCost">Shipping Cost (NPR)</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="shippingAddress">Address</Label>
              <Textarea
                id="shippingAddress"
                value={formData.shippingAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                placeholder="Enter shipping address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingCity">City</Label>
                <Input
                  id="shippingCity"
                  value={formData.shippingCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingCity: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="shippingDistrict">District</Label>
                <Input
                  id="shippingDistrict"
                  value={formData.shippingDistrict}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingDistrict: e.target.value }))}
                  placeholder="District"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingProvince">Province</Label>
                <Input
                  id="shippingProvince"
                  value={formData.shippingProvince}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingProvince: e.target.value }))}
                  placeholder="Province"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isUpdating}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Shipping Cost:</span>
              <p className="text-lg font-semibold">NPR {formData.shippingCost.toFixed(2)}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">Address:</span>
              <p className="text-gray-900">{formData.shippingAddress}</p>
              <p className="text-gray-900">{formData.shippingCity}, {formData.shippingDistrict}</p>
              <p className="text-gray-900">{formData.shippingProvince}</p>
      
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}