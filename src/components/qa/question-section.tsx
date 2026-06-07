'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { createQuestionAction, answerQuestionAction } from '@/actions/questions'
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface QuestionItem {
  id: string
  content: string
  answer: string | null
  answerBy: string | null
  answeredAt: Date | null
  status: string
  createdAt: Date
  user: { id: string; name: string | null; image: string | null }
}

interface QuestionSectionProps {
  entityType: 'venue' | 'event'
  entityId: string
  questions: QuestionItem[]
  currentUserId?: string
  entityOwnerId?: string
}

export function QuestionSection({ entityType, entityId, questions, currentUserId, entityOwnerId }: QuestionSectionProps) {
  const [items, setItems] = useState(questions)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  async function handleAsk() {
    if (!question.trim()) return
    setLoading(true)
    try {
      const result = await createQuestionAction(entityType, entityId, { content: question.trim() })
      if (result.success && result.data) {
        setItems((prev) => [{ ...result.data!, user: { id: currentUserId!, name: 'Tú', image: null } }, ...prev])
        setQuestion('')
        toast.success('Pregunta enviada.')
      } else {
        toast.error(result.error ?? 'Error.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnswer(questionId: string) {
    if (!answer.trim()) return
    setAnswerLoading(true)
    try {
      const result = await answerQuestionAction(questionId, { answer: answer.trim() })
      if (result.success && result.data) {
        setItems((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, answer: result.data!.answer, answerBy: result.data!.answerBy, answeredAt: result.data!.answeredAt, status: 'ANSWERED' }
              : q
          )
        )
        setAnsweringId(null)
        setAnswer('')
        toast.success('Respuesta publicada.')
      } else {
        toast.error(result.error ?? 'Error.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setAnswerLoading(false)
    }
  }

  const isOwner = currentUserId === entityOwnerId

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Preguntas y respuestas {items.length > 0 && `(${items.length})`}
        </h2>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {currentUserId && !isOwner && (
            <div className="flex gap-2">
              <Textarea
                placeholder="¿Tienes una pregunta?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                rows={2}
                className="text-sm flex-1"
              />
              <Button onClick={handleAsk} disabled={loading || !question.trim()} className="self-end">
                {loading ? '...' : 'Preguntar'}
              </Button>
            </div>
          )}

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay preguntas aún. Sé el primero en preguntar.
            </p>
          )}

          {items.map((q) => (
            <div key={q.id} className="space-y-2">
              <div className="flex gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={q.user.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">{q.user.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{q.user.name ?? 'Anónimo'}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(q.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-0.5">{q.content}</p>
                </div>
              </div>

              {q.answer && (
                <div className="ml-9 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{q.answerBy ?? 'Propietario'}</span>
                    {q.answeredAt && <span className="text-[10px] text-emerald-600/60">{formatDate(q.answeredAt)}</span>}
                  </div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">{q.answer}</p>
                </div>
              )}

              {!q.answer && isOwner && (
                <div className="ml-9">
                  {answeringId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Escribe tu respuesta..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        maxLength={1000}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAnswer(q.id)} disabled={answerLoading || !answer.trim()}>
                          {answerLoading ? '...' : 'Responder'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAnsweringId(null); setAnswer('') }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAnsweringId(q.id)} className="text-xs">
                      Responder
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
