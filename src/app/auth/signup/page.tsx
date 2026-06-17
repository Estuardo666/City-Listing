'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mail, Lock, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OtpInput } from '@/components/auth/otp-input'
import { TurnstileWidget } from '@/components/auth/turnstile-widget'

const RESEND_COOLDOWN = 60

export default function SignUpPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<1 | 2>(1)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleSendCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!turnstileToken) {
      setError('Completa la verificación de seguridad')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al enviar código')
        setTurnstileToken(null)
        return
      }

      setStep(2)
      setResendCooldown(RESEND_COOLDOWN)
    } catch {
      setError('Error al enviar código')
    } finally {
      setIsLoading(false)
    }
  }, [email, password, confirmPassword, turnstileToken])

  const handleVerifyCode = useCallback(async (code: string) => {
    setOtpError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setOtpError(data.error ?? 'Código incorrecto')
        setIsLoading(false)
        return
      }

      // Auto-login
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Si falla el login, redirigir a signin
        router.push('/auth/signin?message=Cuenta+creada,+inicia+sesión')
        return
      }

      // Redirect a onboarding
      window.location.href = '/onboarding'
    } catch {
      setOtpError('Error al verificar código')
      setIsLoading(false)
    }
  }, [email, password, router])

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return
    setError('')
    setOtpError('')

    if (!turnstileToken) {
      setOtpError('Completa la verificación de seguridad')
      return
    }

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setOtpError(data.error ?? 'Error al reenviar código')
        setTurnstileToken(null)
        return
      }

      setResendCooldown(RESEND_COOLDOWN)
    } catch {
      setOtpError('Error al reenviar código')
    }
  }, [email, password, resendCooldown, turnstileToken])

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/onboarding' })
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 ? 'Crear Cuenta' : 'Verifica tu correo'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Únete a Vive Loja'
                : `Enviamos un código a ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <form onSubmit={handleSendCode} className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Correo electrónico"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Contraseña"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Confirmar contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <TurnstileWidget
                        onVerify={setTurnstileToken}
                        onExpire={() => setTurnstileToken(null)}
                        onError={() => setTurnstileToken(null)}
                      />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="text-sm text-destructive text-center"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !turnstileToken}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        'Enviar código'
                      )}
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        O continuar con
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignUp}
                  >
                    Google
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/auth/signin" className="text-primary hover:underline">
                      Inicia sesión
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-6"
                >
                  <OtpInput
                    onComplete={handleVerifyCode}
                    disabled={isLoading}
                    error={otpError}
                  />

                  <AnimatePresence>
                    {otpError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm text-destructive text-center"
                      >
                        {otpError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </motion.div>
                  )}

                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isLoading}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {resendCooldown > 0
                        ? `Reenviar en ${resendCooldown}s`
                        : 'Reenviar código'}
                    </button>

                    <button
                      onClick={() => {
                        setStep(1)
                        setOtpError('')
                        setError('')
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Volver
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
