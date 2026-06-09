'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  User,
  Briefcase,
  MessageSquare,
  Upload,
  Shield,
  Loader2,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Animation variants ────────────────────────────────────────────
const iosSpring = [0.16, 1, 0.3, 1] as const

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: iosSpring },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 280 : -280,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.3, ease: iosSpring },
  }),
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: iosSpring } },
}

// ── Types ─────────────────────────────────────────────────────────
interface ClaimWizardProps {
  venueId: string
  venueName: string
  onSuccess?: () => void
  onCancel?: () => void
}

type Step = 0 | 1 | 2 | 3

interface FormData {
  claimerName: string
  claimerEmail: string
  claimerPhone: string
  claimerRole: string
  message: string
}

// ── Step indicators ───────────────────────────────────────────────
const STEPS = [
  { label: 'Datos', icon: User },
  { label: 'Verificación', icon: Mail },
  { label: 'Evidencia', icon: Upload },
  { label: 'Listo', icon: CheckCircle2 },
]

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = i === current
        const isDone = i < current
        return (
          <div key={step.label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  'h-px w-6 transition-colors duration-300 sm:w-10',
                  isDone ? 'bg-emerald-500' : 'bg-border',
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                layout
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-300',
                  isActive
                    ? 'border-foreground bg-foreground text-background'
                    : isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-border bg-background text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </motion.div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors sm:text-xs',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Verification Code Input ───────────────────────────────────────
function CodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return
    const chars = value.split('')
    chars[index] = digit
    const newVal = chars.join('').padEnd(6, '').slice(0, 6)
    onChange(newVal)

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, ''))
    const nextEmpty = Math.min(pasted.length, 5)
    inputsRef.current[nextEmpty]?.focus()
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.25, ease: iosSpring }}
        >
          <input
            ref={(el) => { inputsRef.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'h-14 w-11 rounded-xl border-2 bg-background text-center text-2xl font-bold',
              'transition-all duration-200 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20',
              'disabled:opacity-50 sm:h-16 sm:w-13',
              value[i] ? 'border-foreground' : 'border-border',
            )}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────
export function ClaimVenueWizard({ venueId, venueName, onSuccess, onCancel }: ClaimWizardProps) {
  const [step, setStep] = useState<Step>(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [claimId, setClaimId] = useState<string | null>(null)

  // Form data
  const [form, setForm] = useState<FormData>({
    claimerName: '',
    claimerEmail: '',
    claimerPhone: '',
    claimerRole: '',
    message: '',
  })
  const [code, setCode] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [confidenceScore, setConfidenceScore] = useState(0)

  const updateForm = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const goNext = () => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, 3) as Step)
  }
  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0) as Step)
  }

  // ── Step 1: Submit form ─────────────────────────────────────
  const handleSubmitForm = async () => {
    if (!form.claimerName.trim() || !form.claimerEmail.trim()) {
      toast.error('Nombre y correo son obligatorios.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/claims/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId,
          claimerName: form.claimerName.trim(),
          claimerEmail: form.claimerEmail.trim(),
          claimerPhone: form.claimerPhone.trim() || null,
          claimerRole: form.claimerRole.trim() || null,
          message: form.message.trim() || null,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error ?? 'Error al enviar.')
        return
      }
      setClaimId(data.data.claimId)
      setConfidenceScore(20) // usuario registrado = +20
      toast.success('Código enviado a tu correo.')
      goNext()
    } catch {
      toast.error('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify code ─────────────────────────────────────
  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error('Ingresa los 6 dígitos.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/claims/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, code }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error ?? 'Código incorrecto.')
        return
      }
      setConfidenceScore(data.data.confidenceScore ?? 60)
      toast.success('Correo verificado.')
      goNext()
    } catch {
      toast.error('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Upload evidence ─────────────────────────────────
  const handleUploadEvidence = async (skip = false) => {
    if (!claimId) return

    if (skip) {
      goNext()
      return
    }

    if (!evidenceFile) {
      toast.error('Selecciona un archivo.')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', evidenceFile)

      const res = await fetch(`/api/claims/${claimId}/upload`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error ?? 'Error al subir.')
        return
      }
      setConfidenceScore(data.data.confidenceScore ?? confidenceScore)
      toast.success('Evidencia subida.')
      goNext()
    } catch {
      toast.error('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mx-auto w-full max-w-lg"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold sm:text-2xl">Reclamar negocio</h2>
        <p className="mt-1 text-sm text-muted-foreground">{venueName}</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator current={step} />
      </div>

      {/* Steps content */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="p-6"
          >
            {/* ── STEP 0: Datos del solicitante ──────────── */}
            {step === 0 && (
              <div className="space-y-4">
                <motion.div {...fadeUp}>
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Tu información será verificada antes de aprobar el reclamo.</span>
                  </div>
                </motion.div>

                <motion.div {...fadeUp} className="space-y-1.5">
                  <Label htmlFor="name" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Nombre completo *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Juan Pérez"
                    value={form.claimerName}
                    onChange={(e) => updateForm('claimerName', e.target.value)}
                    maxLength={120}
                  />
                </motion.div>

                <motion.div {...fadeUp} className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Correo electrónico *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={form.claimerEmail}
                    onChange={(e) => updateForm('claimerEmail', e.target.value)}
                    maxLength={200}
                  />
                </motion.div>

                <motion.div {...fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0999999999"
                      value={form.claimerPhone}
                      onChange={(e) => updateForm('claimerPhone', e.target.value)}
                      maxLength={30}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      Cargo
                    </Label>
                    <Input
                      id="role"
                      placeholder="Propietario, Gerente..."
                      value={form.claimerRole}
                      onChange={(e) => updateForm('claimerRole', e.target.value)}
                      maxLength={80}
                    />
                  </div>
                </motion.div>

                <motion.div {...fadeUp} className="space-y-1.5">
                  <Label htmlFor="message" className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Mensaje (opcional)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Describe brevemente por qué eres el dueño de este local..."
                    value={form.message}
                    onChange={(e) => updateForm('message', e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </motion.div>
              </div>
            )}

            {/* ── STEP 1: Verificación de código ─────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <motion.div {...fadeUp} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Revisa tu correo</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enviamos un código de 6 dígitos a{' '}
                    <span className="font-medium text-foreground">{form.claimerEmail}</span>
                  </p>
                </motion.div>

                <motion.div {...fadeUp}>
                  <CodeInput value={code} onChange={setCode} disabled={loading} />
                </motion.div>

                <motion.div {...fadeUp} className="text-center text-xs text-muted-foreground">
                  <p>El código expira en 15 minutos.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCode('')
                      toast.info('Funcionalidad de reenvío próximamente.')
                    }}
                    className="mt-2 underline underline-offset-2 hover:text-foreground"
                  >
                    ¿No recibiste el código? Reenviar
                  </button>
                </motion.div>
              </div>
            )}

            {/* ── STEP 2: Evidencia ──────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <motion.div {...fadeUp} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Evidencia (opcional)</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sube un documento que demuestre la propiedad del negocio.
                  </p>
                </motion.div>

                <motion.div {...fadeUp} className="space-y-3">
                  <div className="rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-foreground/30">
                    <input
                      type="file"
                      id="evidence"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <label htmlFor="evidence" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">
                        {evidenceFile ? evidenceFile.name : 'Seleccionar archivo'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WebP o PDF · Máx 5 MB
                      </p>
                    </label>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Tipos de evidencia aceptados:</p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      <li>RUC o documento tributario</li>
                      <li>Nombramiento o contrato</li>
                      <li>Factura a nombre del negocio</li>
                      <li>Foto del local con rotulación</li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ── STEP 3: Resumen / Éxito ────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <motion.div
                  {...fadeUp}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-lg font-semibold">¡Reclamo enviado!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tu solicitud será revisada por un administrador.
                  </p>
                </motion.div>

                {/* Confidence score */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-border/60 bg-muted/30 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Puntuación de confianza</span>
                    <span className="text-sm font-bold">{confidenceScore}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidenceScore}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: iosSpring }}
                      className={cn(
                        'h-full rounded-full',
                        confidenceScore >= 80
                          ? 'bg-emerald-500'
                          : confidenceScore >= 40
                            ? 'bg-amber-500'
                            : 'bg-red-500',
                      )}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {confidenceScore >= 80
                      ? 'Excelente. Tu reclamo tiene alta probabilidad de aprobación.'
                      : confidenceScore >= 40
                        ? 'Buena. Puedes mejorarla subiendo evidencia.'
                        : 'Puedes mejorarla verificando tu correo y subiendo evidencia.'}
                  </p>
                </motion.div>

                {/* Summary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solicitante</span>
                    <span className="font-medium">{form.claimerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Correo</span>
                    <span className="font-medium">{form.claimerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verificado</span>
                    <span className="font-medium text-emerald-500">✓ Sí</span>
                  </div>
                  {evidenceFile && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Evidencia</span>
                      <span className="font-medium text-emerald-500">✓ Subida</span>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer with navigation */}
        <div className="border-t border-border/60 px-6 py-4">
          <div className="flex items-center justify-between">
            {step < 3 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={step === 0 ? onCancel : goBack}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  {step === 0 ? 'Cancelar' : 'Atrás'}
                </Button>

                {step === 0 && (
                  <Button size="sm" onClick={handleSubmitForm} disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Enviar código
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}

                {step === 1 && (
                  <Button size="sm" onClick={handleVerifyCode} disabled={loading || code.length !== 6}>
                    {loading ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Verificar
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}

                {step === 2 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleUploadEvidence(true)} disabled={loading}>
                      Omitir
                    </Button>
                    <Button size="sm" onClick={() => handleUploadEvidence(false)} disabled={loading || !evidenceFile}>
                      {loading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Subir evidencia
                          <Upload className="ml-1.5 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Button className="mx-auto" size="sm" onClick={onSuccess}>
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
