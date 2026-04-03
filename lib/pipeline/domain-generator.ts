import { generateWithLLM } from '../llm'

export interface DomainCandidate {
  domain: string
  reasoning: string
}

export async function generateDomainCandidates(
  keyword: string,
  score: number,
  sources: string[],
  category: string
): Promise<DomainCandidate[]> {
  const prompt = `You are a domain name expert and startup branding consultant. Generate creative, brandable domain name suggestions for a trending tech keyword.

Keyword: "${keyword}"
Trend Score: ${score}
Sources: ${sources.join(', ')}
Category: ${category}

Generate 5 domain name suggestions that:
1. Are memorable and brandable
2. Related to the keyword's meaning or use case
3. Use a mix of TLDs: .com, .io, .dev, .ai, .co
4. Are short (ideally under 12 characters before the TLD)
5. Could plausibly be a startup or product name

For each domain, provide a brief reasoning (1 sentence) explaining the brand angle.

Respond with a JSON array in this exact format:
[
  {"domain": "example.com", "reasoning": "Clean, memorable name that evokes..."},
  {"domain": "getexample.io", "reasoning": "Action-oriented prefix that..."},
  ...
]

Only respond with the JSON array, no other text.`

  const result = await generateWithLLM(prompt)
  if (Array.isArray(result)) {
    return result.filter(
      (item): item is DomainCandidate =>
        typeof item.domain === 'string' && typeof item.reasoning === 'string'
    )
  }
  throw new Error(`LLM returned non-array: ${JSON.stringify(result)}`)
}
