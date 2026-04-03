import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-6'

export async function callClaude(prompt: string): Promise<unknown> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  const text = content.text.trim()

  try {
    const cleaned = text
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${text.slice(0, 200)}`)
  }
}
