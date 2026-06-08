import 'server-only'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export const auth = () => getServerSession(authOptions)
