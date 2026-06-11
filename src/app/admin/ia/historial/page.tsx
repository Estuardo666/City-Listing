import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, FileText, Image as ImageIcon, Type, CheckCircle, XCircle, Clock } from 'lucide-react'

const SOURCE_ICONS: Record<string, React.ElementType> = {
  IMAGE: ImageIcon,
  PDF: FileText,
  TEXT: Type,
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
}

export default async function AdminIAHistorialPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const logs = await prisma.aIProcessingLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { watchEvent: { select: { id: true, name: true, slug: true } } },
  })

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/ia">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historial de Procesamiento</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Últimos 50 registros de procesamiento IA.
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No hay registros de procesamiento aún.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/admin/ia/procesar">Procesar primer flyer</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const SourceIcon = SOURCE_ICONS[log.sourceType] || FileText
              const statusStyle = STATUS_STYLES[log.status] || STATUS_STYLES.PENDING
              let extractedData: Record<string, unknown> = {}
              try { extractedData = JSON.parse(log.extractedData || '{}') } catch {}

              return (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <SourceIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{log.sourceType}</Badge>
                          <Badge className={`text-xs ${statusStyle}`}>{log.status}</Badge>
                          {log.watchEvent && (
                            <Link href={`/admin/transmisiones`} className="text-xs text-primary hover:underline">
                              → {log.watchEvent.name}
                            </Link>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {(extractedData.performers as string[])?.join(' vs ') || 'Sin datos extraídos'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.createdAt).toLocaleString('es-EC')}
                          </span>
                          {log.tokensUsed && <span>{log.tokensUsed} tokens</span>}
                          {log.processingTimeMs && <span>{log.processingTimeMs}ms</span>}
                        </div>
                      </div>
                      {log.sourceUrl && (
                        <a href={log.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                          Ver fuente
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
