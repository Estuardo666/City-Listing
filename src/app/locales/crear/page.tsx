import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function CreateVenuePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin?intent=business&plan=free&cycle=MONTHLY')
  }

  redirect('/dashboard/locales/crear')
}
