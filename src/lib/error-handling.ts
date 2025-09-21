import { PrismaClientInitializationError, PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export class DatabaseConnectionError extends Error {
  constructor(message: string = 'Database connection failed') {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

export class DatabaseQueryError extends Error {
  constructor(message: string = 'Database query failed') {
    super(message)
    this.name = 'DatabaseQueryError'
  }
}

export function handlePrismaError(error: unknown): Error {
  // console.error('Prisma error:', error)

  if (error instanceof PrismaClientInitializationError) {
    // Database connection issues
    if (error.message.includes("Can't reach database server")) {
      return new DatabaseConnectionError(
        'Unable to connect to the database. Please check your database configuration and ensure the database server is running.'
      )
    }
    return new DatabaseConnectionError('Database initialization failed')
  }

  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new DatabaseQueryError('A record with this data already exists')
      case 'P2025':
        return new DatabaseQueryError('Record not found')
      case 'P2003':
        return new DatabaseQueryError('Foreign key constraint failed')
      case 'P2016':
        return new DatabaseQueryError('Query interpretation error')
      default:
        return new DatabaseQueryError(`Database error: ${error.message}`)
    }
  }

  if (error instanceof Error) {
    return error
  }

  return new Error('An unexpected error occurred')
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const handledError = handlePrismaError(error)
    // console.error(`Error in ${context}:`, handledError.message)
    throw handledError
  }
}

export function createApiErrorResponse(error: Error, defaultMessage: string = 'An error occurred') {
  if (error instanceof DatabaseConnectionError) {
    return {
      success: false,
      error: error.message,
      code: 'DATABASE_CONNECTION_ERROR'
    }
  }

  if (error instanceof DatabaseQueryError) {
    return {
      success: false,
      error: error.message,
      code: 'DATABASE_QUERY_ERROR'
    }
  }

  return {
    success: false,
    error: defaultMessage,
    code: 'INTERNAL_ERROR'
  }
}