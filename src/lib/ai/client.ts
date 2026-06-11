import OpenAI from 'openai'

export const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  together: 'https://api.together.xyz/v1',
  fireworks: 'https://api.fireworks.ai/inference/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  ollama: 'http://localhost:11434/v1',
  lmstudio: 'http://localhost:1234/v1',
}

export function getProviderBaseUrl(provider: string, override?: string | null): string {
  if (override) return override.replace(/\/+$/, '')
  return PROVIDER_BASE_URLS[provider] ?? PROVIDER_BASE_URLS.openai
}

export function createAIClient(params: {
  provider: string
  apiKey: string
  baseUrl?: string | null
}): OpenAI {
  return new OpenAI({
    apiKey: params.apiKey,
    baseURL: getProviderBaseUrl(params.provider, params.baseUrl),
  })
}
