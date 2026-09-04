import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateRouteStatusAction } from '@/actions/routes/create-route'

export default async function RouteModerationPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') redirect('/auth/signin')
  const routes = await prisma.route.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { stops: { orderBy: [{ day: 'asc' }, { order: 'asc' }] } } })
  async function moderate(form: FormData) {
    'use server'
    const result = await updateRouteStatusAction({ routeId: form.get('routeId'), status: form.get('status') })
    if (!result.success) throw new Error(result.error)
  }
  return <section className="section-shell space-y-6 py-8"><h1 className="text-3xl font-semibold">Rutas turísticas</h1>
    <Link className="underline" href="/rutas/crear">Crear ruta turística</Link>
    {routes.length === 0 && <p>No hay rutas para revisar.</p>}
    {routes.map(route => <article key={route.id} className="space-y-3 rounded-2xl border p-5"><h2 className="text-xl font-semibold">{route.title}</h2>
      <p>{route.description}</p><p>{route.type} · {route.status} · {route.estimatedMinutes ?? 'Sin duración'} min</p>
      <ol className="list-decimal pl-5">{route.stops.map(stop => <li key={stop.id}>Día {stop.day}: {stop.title} {stop.notes && `— ${stop.notes}`}</li>)}</ol>
      <form action={moderate} className="flex gap-3"><input type="hidden" name="routeId" value={route.id} />
        <button className="rounded-lg border px-4 py-2" name="status" value="APPROVED">Publicar</button>
        <button className="rounded-lg border px-4 py-2" name="status" value="REJECTED">Rechazar</button>
      </form></article>)}
  </section>
}
