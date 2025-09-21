import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, role: true } })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = (body?.name || '').toString().trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const updated = await prisma.user.update({ where: { id: session.user.id }, data: { name } })
  return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role })
}

