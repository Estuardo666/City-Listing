import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      onboardingCompleted: boolean
      onboardingSkipped: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    onboardingCompleted?: boolean
    onboardingSkipped?: boolean
  }
}
