import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const validatedFields = credentialsSchema.safeParse(credentials)
      if (!validatedFields.success) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: {
          email: validatedFields.data.email,
        },
      })

      if (!user) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.picture = user.image
      }

      // Keep token data in sync with DB updates (e.g. profile image changes)
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, image: true },
        })

        if (dbUser) {
          token.role = dbUser.role
          token.picture = dbUser.image
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? ''
        session.user.role = token.role
        session.user.image = token.picture as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
