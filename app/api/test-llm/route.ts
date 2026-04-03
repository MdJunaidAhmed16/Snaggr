import { NextResponse } from 'next/server'

// GET /api/test-llm — shows exactly what's happening with your LLM config
// Remove this file before going to production
export async function GET() {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() ?? 'anthropic'
  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY

  const config = { provider, hasGeminiKey, hasAnthropicKey }

  try {
    if (provider === 'gemini') {
      if (!hasGeminiKey) {
        return NextResponse.json({ config, error: 'GEMINI_API_KEY is not set' }, { status: 503 })
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const result = await model.generateContent('Say "hello" and nothing else.')
      const text = result.response.text()

      return NextResponse.json({ config, success: true, rawResponse: text })
    } else {
      if (!hasAnthropicKey) {
        return NextResponse.json({ config, error: 'ANTHROPIC_API_KEY is not set' }, { status: 503 })
      }

      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 32,
        messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
      })
      const text = msg.content[0].type === 'text' ? msg.content[0].text : 'non-text response'

      return NextResponse.json({ config, success: true, rawResponse: text })
    }
  } catch (error) {
    return NextResponse.json({
      config,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    }, { status: 500 })
  }
}
