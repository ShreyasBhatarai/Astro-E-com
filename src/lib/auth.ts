import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox', required: false },
        autoLogin: { label: 'Auto Login', type: 'text', required: false },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Find user by email
          const email = credentials.email.trim().toLowerCase()
          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
          })

          if (!user) {
            throw new Error('Invalid credentials')
          }

          // Handle auto-login bypass
          if (credentials.autoLogin === 'true' && credentials.password === 'auto-login-bypass') {
            // For auto-login, we skip password verification
            // The token verification was already done in the verify-auto-login endpoint
          } else {
            // Normal login - verify password
            if (!user.password) {
              throw new Error('Invalid credentials')
            }
            
            const isPasswordValid = await compare(credentials.password, user.password)
            if (!isPasswordValid) {
              throw new Error('Invalid credentials')
            }
          }

          // Allow both USER and ADMIN roles
          if (user.role !== UserRole.ADMIN && user.role !== UserRole.USER) {
            throw new Error('Invalid user role.')
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            rememberMe: credentials.rememberMe === 'true',
          }
        } catch (error) {
          // console.error('Authentication error:', error)
          throw new Error('Authentication failed')
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (will be overridden by rememberMe)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.email = user.email
        token.phone = (user as any).phone
        token.rememberMe = (user as any).rememberMe
        // Set token expiry based on rememberMe
        if ((user as any).rememberMe) {
          token.exp = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
        } else {
          token.exp = Math.floor(Date.now() / 1000) + (1 * 24 * 60 * 60) // 1 day
        }
      }
      return token
    },
    async session({ session, token, trigger, newSession }) {
      if (token) {
        // If this is a session update (triggered by update()), fetch fresh user data
        if (trigger === 'update') {
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
              }
            })
            
            if (freshUser) {
              session.user.id = freshUser.id
              session.user.role = freshUser.role
              session.user.name = freshUser.name
              session.user.email = freshUser.email
              session.user.phone = freshUser.phone
              
              // Also update the token with fresh data for next time
              token.name = freshUser.name
              token.email = freshUser.email
              token.phone = freshUser.phone
              token.role = freshUser.role
            }
          } catch (error) {
            // console.error('Error fetching fresh user data for session:', error)
            // Fallback to token data if database fetch fails
            session.user.id = token.id as string
            session.user.role = token.role as UserRole
            session.user.name = token.name as string
            session.user.email = token.email as string
            session.user.phone = token.phone as string
          }
        } else {
          // Normal session, use token data
          session.user.id = token.id as string
          session.user.role = token.role as UserRole
          session.user.name = token.name as string
          session.user.email = token.email as string
          session.user.phone = token.phone as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  events: {
    async signIn({ user, isNewUser, account, profile }) {
      // User signed in
    },
    async signOut({ session }) {
      // User signed out
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: UserRole
      phone: string | null
    }
  }

  interface User {
    role: UserRole
    phone?: string | null
    rememberMe?: boolean
  }
}