import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentMethod } from '@prisma/client'

interface CreateOrderData {
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  district: string
  province: string
  postalCode: string
  paymentMethod: PaymentMethod
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  subtotal: number
  shippingCost: number
  total: number
}

export async function createOrder(data: CreateOrderData, userId?: string) {
  try {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const shippingAddress = JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      district: data.district,
      province: data.province,
      postalCode: data.postalCode
    })

    const orderData = {
      orderNumber,
      status: OrderStatus.PENDING,
      paymentMethod: data.paymentMethod,
      subtotal: data.subtotal,
      shippingCost: data.shippingCost,
      total: data.total,
      shippingAddress,
      shippingCity: data.city,
      shippingDistrict: data.district,
      shippingProvince: data.province,
      shippingName: `${data.firstName} ${data.lastName}`,
      shippingPhone: data.phone,
      orderItems: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }

    if (userId) {
      await prisma.order.create({
        data: {
          ...orderData,
          user: {
            connect: { id: userId }
          }
        }
      })
    } else {
      await prisma.order.create({
        data: {
          ...orderData
        } as any
      })
    }

    return { orderNumber }
  } catch (error) {
    // console.error('Error creating order:', error)
    throw new Error('Failed to create order')
  }
}

export async function getOrderByNumber(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return null
    }

    return {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: JSON.parse(order.shippingAddress),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
          weight: item.product.weight ? Number(item.product.weight) : null,
        }
      }))
    }
  } catch (error) {
    // console.error('Error fetching order:', error)
    throw new Error('Failed to fetch order')
  }
}

export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: JSON.parse(order.shippingAddress),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
          weight: item.product.weight ? Number(item.product.weight) : null,
        }
      }))
    })) as any[]
  } catch (error) {
    // console.error('Error fetching user orders:', error)
    throw new Error('Failed to fetch user orders')
  }
}

export async function getOrdersByPhone(phone: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { shippingPhone: phone },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: JSON.parse(order.shippingAddress),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
          weight: item.product.weight ? Number(item.product.weight) : null,
        }
      }))
    })) as any[]
  } catch (error) {
    // console.error('Error fetching orders by phone:', error)
    throw new Error('Failed to fetch orders by phone')
  }
}