"use client"

import React from 'react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface OrderQrDialogProps {
  order: {
    id: string
    orderNumber: string
    status?: string
    createdAt?: string | Date
    subtotal: number
    shippingCost: number
    total: number
    shippingName: string
    shippingPhone: string
    shippingAddress: string
    shippingCity: string
    shippingDistrict: string
    shippingProvince: string
    user?: {
      email?: string | null
      name?: string | null
      phone?: string | null
    } | null
    orderItems: Array<{
      id: string
      quantity: number
      price: number
      product: {
        name: string
        sku: string | null
      }
    }>
  }
}

export function OrderQrDialog({ order }: OrderQrDialogProps) {
  const [open, setOpen] = React.useState(false)

  const payload = React.useMemo(() => {
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : ''
    const customerName =  order.shippingName || ''
    const customerPhone =  order.shippingPhone || ''
    const customerEmail = order.user?.email || ''

    const lines: string[] = [
      'ORDER DETAILS',
      `Order: #${order.orderNumber}`,
      `Status: ${order.status ?? ''}`,
      `Date: ${dateStr}`,
      `Total: Rs. ${Number(order.total).toFixed(2)}`,
      '',
      'CUSTOMER INFORMATION',
      `Name: ${customerName}`,
      `Phone: ${customerPhone}`,
      `Email: ${customerEmail}`,
      '',
      'SHIPPING ADDRESS',
      `Name: ${order.shippingName}`,
      `Phone: ${order.shippingPhone}`,
      `Address: ${order.shippingAddress}`,
      `City: ${order.shippingCity}`,
      `District: ${order.shippingDistrict}`,
      `Province: ${order.shippingProvince}`,
      '',
      'ITEMS SUMMARY',
      `Subtotal: Rs. ${Number(order.subtotal).toFixed(2)}`,
      `Shipping: Rs. ${Number(order.shippingCost).toFixed(2)}`,
      `Total: Rs. ${Number(order.total).toFixed(2)}`
    ]

    return lines.join('\n')
  }, [order])

  const qrUrl = React.useMemo(() => {
    const data = encodeURIComponent(payload)
    // Using a lightweight public QR image service to avoid adding dependencies
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`
  }, [payload])

  const handlePrint = () => {
    // Open a minimal print window for the QR, clean (no branding)
    const html = `<!doctype html><html><head><title>Order QR</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:24px;text-align:center}
        img{width:320px;height:320px}
      </style>
    </head><body>
      <img src="${qrUrl}" alt="Order QR"/>
      <script>window.onload=()=>window.print()</script>
    </body></html>`

    const w = window.open('', 'printqr', 'width=420,height=560')
    if (w) {
      w.document.open()
      w.document.write(html)
      w.document.close()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          Generate QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="rounded-lg border bg-muted/20 p-4 shadow-sm">
            <img src={qrUrl} alt={`QR for order ${order.orderNumber}`} width={320} height={320} className="rounded-md" />
          </div>

          {/* Details matching QR payload */}
          <div className="w-full text-sm text-left space-y-2">
            <div className="font-semibold">ORDER DETAILS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <div>Order: <span className="font-medium">#{order.orderNumber}</span></div>
              <div>Status: <span className="font-medium">{order.status ?? ''}</span></div>
              <div>Date: <span className="font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : ''}</span></div>
              <div>Total: <span className="font-medium">{formatCurrency(order.total)}</span></div>
            </div>
            <div className="font-semibold pt-2">CUSTOMER INFORMATION</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <div>Name: <span className="font-medium">{order.user?.name || order.shippingName || ''}</span></div>
              <div>Phone: <span className="font-medium">{order.user?.phone || order.shippingPhone || ''}</span></div>
              <div>Email: <span className="font-medium">{order.user?.email || ''}</span></div>
            </div>
            <div className="font-semibold pt-2">SHIPPING ADDRESS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <div>Name: <span className="font-medium">{order.shippingName}</span></div>
              <div>Phone: <span className="font-medium">{order.shippingPhone}</span></div>
              <div className="sm:col-span-2">Address: <span className="font-medium">{order.shippingAddress}</span></div>
              <div>City: <span className="font-medium">{order.shippingCity}</span></div>
              <div>District: <span className="font-medium">{order.shippingDistrict}</span></div>
              <div>Province: <span className="font-medium">{order.shippingProvince}</span></div>
            </div>
            <div className="font-semibold pt-2">ITEMS SUMMARY</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <div>Subtotal: <span className="font-medium">{formatCurrency(order.subtotal)}</span></div>
              <div>Shipping: <span className="font-medium">{formatCurrency(order.shippingCost)}</span></div>
              <div>Total: <span className="font-medium">{formatCurrency(order.total)}</span></div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

