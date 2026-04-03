import { callClaude } from './claude'
import { callGemini } from './gemini'
import { callOpenRouter } from './openrouter'

// LLM_PROVIDER options: 'anthropic' | 'gemini' | 'openrouter'
// Defaults to 'anthropic' if not set
function getProvider(): 'anthropic' | 'gemini' | 'openrouter' {
  const p = process.env.LLM_PROVIDER?.toLowerCase()
  if (p === 'gemini') return 'gemini'
  if (p === 'openrouter') return 'openrouter'
  return 'anthropic'
}

export async function generateWithLLM(prompt: string): Promise<unknown> {
  const provider = getProvider()
  if (provider === 'gemini') return callGemini(prompt)
  if (provider === 'openrouter') return callOpenRouter(prompt)
  return callClaude(prompt)
}

export interface GeneratedDomain {
  domain: string
  reasoning: string
}

export async function generateBusinessDomains(
  idea: string,
  tlds: string[]
): Promise<GeneratedDomain[]> {
  const tldList = tlds.length > 0 ? tlds.join(', ') : '.com, .io, .dev, .ai, .co'

  const prompt = `You are a startup naming expert and domain branding consultant. Generate creative, brandable domain names for the following business idea.

<business_idea>
${idea}
</business_idea>

Available TLDs to use: ${tldList}

Requirements:
- Generate 8-10 unique domain name suggestions
- Each domain should be memorable, easy to spell, and easy to say
- Mix different naming strategies: descriptive, abstract, portmanteau, acronym, action-based
- Prefer short names (under 15 characters including TLD)
- The domain should evoke the core value proposition of the business
- Avoid hyphens and numbers
- Consider which TLD fits the brand personality (e.g., .dev for developer tools, .ai for AI products)

For each domain, provide:
- The full domain name (e.g., "example.com")
- A 1-2 sentence reasoning explaining the brand angle and why it works

Respond with a JSON array in this exact format:
[
  {
    "domain": "brandname.com",
    "reasoning": "Explains why this name works for the business idea..."
  },
  ...
]

Only respond with the JSON array, no other text.`

  try {
    const result = await generateWithLLM(prompt)
    if (!Array.isArray(result)) throw new Error('LLM did not return an array')

    return result.filter(
      (item): item is GeneratedDomain =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.domain === 'string' &&
        typeof item.reasoning === 'string'
    )
  } catch (error) {
    console.error('generateBusinessDomains error:', error)
    throw error
  }
}
