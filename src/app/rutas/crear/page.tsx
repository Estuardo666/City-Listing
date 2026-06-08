import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RouteForm } from '@/components/route/route-form'

export const metadata = {
  title: 'Crear ruta - Vive Loja',
}

export default async function CreateRoutePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const venues = await prisma.venue.findMany({
    where: { status: 'APPROVED' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <section className="section-shell max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Crear ruta turística</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Diseña una ruta para que otros exploren Loja
          </p>
        </div>
        <RouteForm venues={venues} />
      </section>
    </div>
  )
}
