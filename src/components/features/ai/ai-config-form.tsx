'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, Wifi } from 'lucide-react'
import { getAIConfigAction, saveAIConfigAction, testConnectionAction, type AIConfigData } from '@/actions/ai/config'
import { PROVIDER_BASE_URLS } from '@/lib/ai/client'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (via OpenRouter)' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'together', label: 'Together AI' },
  { value: 'fireworks', label: 'Fireworks AI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'lmstudio', label: 'LM Studio (local)' },
  { value: 'custom', label: 'Custom (OpenAI Compatible)' },
]

export function AIConfigForm() {
  const [config, setConfig] = useState<AIConfigData>({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    modelVision: '',
    modelText: '',
    timeout: 30,
    temperature: 0.1,
    maxTokens: 4096,
  })
  const [apiKeyPlain, setApiKeyPlain] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, startSave] = useTransition()
  const [testing, startTest] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; models?: string[] } | null>(null)
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([])

  useEffect(() => {
    getAIConfigAction().then((res) => {
      if (res.success && res.data) {
        setConfig(res.data)
      }
      setLoading(false)
    })
  }, [])

  function handleSave() {
    startSave(async () => {
      const res = await saveAIConfigAction({ ...config, apiKeyPlain: apiKeyPlain || undefined })
      if (res.success) {
        toast.success('Configuración guardada')
        setApiKeyPlain('')
      } else {
        toast.error(res.error || 'Error guardando')
      }
    })
  }

  function handleTest() {
    startTest(async () => {
      setTestResult(null)
      const res = await testConnectionAction()
      if (res.success && res.data) {
        setTestResult({ ok: true, message: 'Conexión exitosa', models: res.data.models })
        setDiscoveredModels(res.data.models)
      } else {
        setTestResult({ ok: false, message: res.error || 'Error de conexión' })
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proveedor de IA</CardTitle>
          <CardDescription>Configura el proveedor y credenciales para el procesamiento de flyers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select value={config.provider} onValueChange={(v) => setConfig((c) => ({ ...c, provider: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder={config.apiKey ? '••••••••' : 'sk-...'}
                value={apiKeyPlain}
                onChange={(e) => setApiKeyPlain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {config.apiKey ? 'Dejar vacío para mantener la clave actual.' : 'Ingresa tu API Key.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL Override (opcional)</Label>
            <Input
              placeholder={PROVIDER_BASE_URLS[config.provider] || 'https://api.openai.com/v1'}
              value={config.baseUrl}
              onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Usa esto para conectar servidores propios (Ollama, LM Studio, proxies, etc.)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modelos</CardTitle>
          <CardDescription>Selecciona los modelos para cada tarea. Usa &quot;Cargar modelos&quot; para descubrir los disponibles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
              Probar conexión / Cargar modelos
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${testResult.ok ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
              {testResult.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Modelo Vision (análisis de imágenes)</Label>
              <Input
                list="models-list"
                placeholder="gpt-4o, qwen-vl-max, claude-sonnet-4-20250514..."
                value={config.modelVision}
                onChange={(e) => setConfig((c) => ({ ...c, modelVision: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo Texto (extracción de datos)</Label>
              <Input
                list="models-list"
                placeholder="gpt-4o, deepseek-chat, llama-4-scout..."
                value={config.modelText}
                onChange={(e) => setConfig((c) => ({ ...c, modelText: e.target.value }))}
              />
            </div>
          </div>

          {discoveredModels.length > 0 && (
            <datalist id="models-list">
              {discoveredModels.map((m) => <option key={m} value={m} />)}
            </datalist>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parámetros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Timeout (segundos)</Label>
              <Input
                type="number"
                min={5}
                max={120}
                value={config.timeout}
                onChange={(e) => setConfig((c) => ({ ...c, timeout: parseInt(e.target.value) || 30 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Temperatura</Label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={config.temperature}
                onChange={(e) => setConfig((c) => ({ ...c, temperature: parseFloat(e.target.value) || 0.1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Máximo tokens</Label>
              <Input
                type="number"
                min={256}
                max={32000}
                value={config.maxTokens}
                onChange={(e) => setConfig((c) => ({ ...c, maxTokens: parseInt(e.target.value) || 4096 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar configuración
        </Button>
      </div>
    </div>
  )
}
