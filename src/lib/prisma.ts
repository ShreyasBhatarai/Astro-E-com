import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

// Improved Prisma client with better error handling and connection pooling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// Graceful shutdown
async function gracefulShutdown() {
  await prisma.$disconnect()
}

process.on('beforeExit', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma