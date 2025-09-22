'use client'

import React, { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateNepalPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export function PhoneInput({ 
  value, 
  onChange, 
  onValidationChange,
  className,
  required = true,
  disabled = false
}: PhoneInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isTouched, setIsTouched] = useState(false)

  useEffect(() => {
    if (value.trim() === '') {
      setIsValid(null)
      onValidationChange?.(false)
      return
    }

    const valid = validateNepalPhone(value)
    setIsValid(valid)
    onValidationChange?.(valid)
  }, [value, onValidationChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow only numbers, limit to 10 digits
    const sanitized = inputValue.replace(/[^\d]/g, '').slice(0, 10)
    onChange(sanitized)
  }

  const handleBlur = () => {
    setIsTouched(true)
  }

  const getValidationIcon = () => {
    if (!isTouched && value === '') return null
    
    if (isValid === true) {
      return <Check className="h-4 w-4 text-green-600" />
    } else if (isValid === false) {
      return <X className="h-4 w-4 text-red-600" />
    }
    return null
  }

  const getHelperText = () => {
    if (!isTouched && value === '') return null
    
    if (value === '') {
      return required ? 'Phone number is required' : null
    }
    
    if (isValid === true) {
      return 'Valid phone number (10 digits)'
    } else if (isValid === false) {
      return 'Please enter exactly 10 digits (e.g., 9812345678)'
    }
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="phone">
        Phone Number {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="phone"
          type="tel"
          placeholder="98XXXXXXXX (10 digits)"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'pr-10',
            isValid === true && 'border-green-600 focus:border-green-600',
            isValid === false && isTouched && 'border-red-600 focus:border-red-600',
            disabled && 'bg-muted cursor-not-allowed'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      {getHelperText() && (
        <p className={cn(
          'text-xs',
          isValid === true && 'text-green-600',
          isValid === false && 'text-red-600',
          isValid === null && 'text-muted-foreground'
        )}>
          {getHelperText()}
        </p>
      )}
    </div>
  )
}