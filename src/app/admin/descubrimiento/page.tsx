import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DiscoveryMetricsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') redirect('/auth/signin')
  const rows = await prisma.interactionEvent.groupBy({ by: ['kind', 'action', 'source'],
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } }, _count: { _all: true },
    orderBy: [{ kind: 'asc' }, { action: 'asc' }, { source: 'asc' }] })
  return <section className="section-shell py-8 space-y-5">
    <h1 className="text-2xl font-semibold">Descubrimiento · últimos 30 días</h1>
    <p>Guardados confirmados y clics en «Cómo llegar», compartidos por web e iOS.</p>
    <p className="text-sm text-muted-foreground">No incluye guardados anónimos que permanecen sólo en el teléfono. Los clics no representan visitas físicas. No se reconstruyen métricas anteriores a esta entrega.</p>
    <Link href="/dashboard/colecciones" className="underline">Gestionar colecciones editoriales</Link>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <caption className="sr-only">Interacciones por tipo y plataforma</caption>
      <thead><tr>{['Contenido', 'Acción', 'Plataforma', 'Total'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
      <tbody>{rows.map(r => <tr className="border-t" key={`${r.kind}:${r.action}:${r.source}`}>
        <td className="p-3">{r.kind}</td><td className="p-3">{r.action === 'save' ? 'Guardar' : 'Cómo llegar'}</td>
        <td className="p-3">{r.source}</td><td className="p-3">{r._count._all}</td>
      </tr>)}</tbody>
    </table></div>
    {!rows.length && <p>Todavía no hay interacciones registradas.</p>}
    <p className="text-sm text-muted-foreground">Una colección aparece en Inicio si es pública, pertenece a un administrador y contiene únicamente locales aprobados y activos. Usa la descripción y las notas de cada lugar para explicar tu selección.</p>
  </section>
}
