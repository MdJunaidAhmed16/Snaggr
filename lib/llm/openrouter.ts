// OpenRouter is OpenAI-compatible — no extra SDK needed, just fetch.
// Default model: google/gemini-2.0-flash-exp:free (free tier, fast)
// Override via OPENROUTER_MODEL env var, e.g. "meta-llama/llama-3.3-70b-instruct:free"

const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free'

export async function callOpenRouter(prompt: string): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://snaggr.vercel.app',
      'X-Title': 'Snaggr',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenRouter returned empty content')

  // The prompt asks for a JSON array but response_format wraps it.
  // Parse the string content — it may be a raw array or wrapped object.
  try {
    const parsed = JSON.parse(content)
    // If the model wrapped the array in an object key, unwrap it
    if (Array.isArray(parsed)) return parsed
    // Common wrapping patterns: { domains: [...] } or { suggestions: [...] }
    const firstArrayVal = Object.values(parsed).find((v) => Array.isArray(v))
    if (firstArrayVal) return firstArrayVal
    return parsed
  } catch {
    throw new Error(`OpenRouter returned non-JSON content: ${content.slice(0, 200)}`)
  }
}
