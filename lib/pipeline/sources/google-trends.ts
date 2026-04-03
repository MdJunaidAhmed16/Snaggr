export interface TrendItem {
  term: string
  velocity: number   // percent change week-over-week
  isRising: boolean
}

const TECH_KEYWORDS = [
  'artificial intelligence',
  'machine learning',
  'large language model',
  'blockchain',
  'web3',
  'saas',
  'developer tools',
  'open source',
  'cloud computing',
  'cybersecurity',
  'fintech',
  'no code',
  'low code',
  'api',
  'kubernetes',
  'rust programming',
  'vector database',
  'retrieval augmented generation',
  'autonomous agent',
  'multimodal',
]

interface WikiPageviewResponse {
  items: Array<{
    project: string
    article: string
    granularity: string
    timestamp: string
    access: string
    agent: string
    views: number
  }>
}

async function fetchWikiPageviews(article: string, days: number): Promise<number[]> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const formatDate = (d: Date) =>
      d.toISOString().split('T')[0].replace(/-/g, '')

    const encodedArticle = encodeURIComponent(
      article.replace(/ /g, '_').replace(/\//g, '%2F')
    )

    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodedArticle}/daily/${formatDate(startDate)}/${formatDate(endDate)}`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Snaggr-Domain-Intelligence/1.0' },
      next: { revalidate: 86400 },
    })

    if (!res.ok) return []
    const data: WikiPageviewResponse = await res.json()
    return (data.items ?? []).map((i) => i.views)
  } catch {
    return []
  }
}

function calcVelocity(views: number[]): number {
  if (views.length < 7) return 0
  const recent = views.slice(-3).reduce((a, b) => a + b, 0) / 3
  const older = views.slice(0, 4).reduce((a, b) => a + b, 0) / 4
  if (older === 0) return 0
  return ((recent - older) / older) * 100
}

// Simplified term mappings for Wikipedia articles
const WIKI_MAPPINGS: Record<string, string> = {
  'artificial intelligence': 'Artificial_intelligence',
  'machine learning': 'Machine_learning',
  'large language model': 'Large_language_model',
  blockchain: 'Blockchain',
  web3: 'Web3',
  saas: 'Software_as_a_service',
  'developer tools': 'Development_tools',
  'open source': 'Open_source',
  'cloud computing': 'Cloud_computing',
  cybersecurity: 'Computer_security',
  fintech: 'Financial_technology',
  'no code': 'No-code_development_platform',
  'low code': 'Low-code_development_platform',
  api: 'API',
  kubernetes: 'Kubernetes',
  'rust programming': 'Rust_(programming_language)',
  'vector database': 'Vector_database',
  'retrieval augmented generation': 'Retrieval-augmented_generation',
  'autonomous agent': 'Intelligent_agent',
  multimodal: 'Multimodal_learning',
}

export async function fetchGoogleTrendsSignals(): Promise<TrendItem[]> {
  const results: TrendItem[] = []

  // Fetch in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < TECH_KEYWORDS.length; i += batchSize) {
    const batch = TECH_KEYWORDS.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (term) => {
        try {
          const wikiArticle = WIKI_MAPPINGS[term] ?? term.replace(/ /g, '_')
          const views = await fetchWikiPageviews(wikiArticle, 14)
          const velocity = calcVelocity(views)
          return {
            term,
            velocity: Math.round(velocity * 10) / 10,
            isRising: velocity > 5,
          }
        } catch {
          return { term, velocity: 0, isRising: false }
        }
      })
    )
    results.push(...batchResults)
    // Small delay between batches to be respectful of rate limits
    if (i + batchSize < TECH_KEYWORDS.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return results.sort((a, b) => b.velocity - a.velocity)
}
