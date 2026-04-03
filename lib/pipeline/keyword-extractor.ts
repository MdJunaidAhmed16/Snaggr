import type { HNItem } from './sources/hackernews'
import type { GitHubRepo } from './sources/github'
import type { TrendItem } from './sources/google-trends'

export interface ExtractedKeyword {
  keyword: string
  category: string
  sourceCounts: {
    hn: number
    github: number
    trends: number
  }
}

const TECH_TERMS: Set<string> = new Set([
  'ai', 'llm', 'gpt', 'ml', 'nlp', 'api', 'saas', 'devops', 'cli', 'sdk',
  'blockchain', 'crypto', 'defi', 'nft', 'web3', 'dao',
  'kubernetes', 'docker', 'serverless', 'microservices', 'graphql', 'grpc',
  'rust', 'golang', 'typescript', 'python', 'swift', 'kotlin',
  'vector', 'embedding', 'transformer', 'rag', 'agent', 'copilot',
  'fintech', 'edtech', 'healthtech', 'proptech', 'cleantech',
  'open source', 'no code', 'low code', 'zero trust', 'edge computing',
  'wasm', 'webassembly', 'deno', 'bun', 'astro', 'nextjs', 'remix',
  'chatbot', 'automation', 'workflow', 'analytics', 'dashboard',
  'observability', 'monitoring', 'logging', 'tracing',
  'marketplace', 'platform', 'infrastructure', 'tool',
])

const CATEGORY_MAP: Record<string, string> = {
  ai: 'AI/ML', llm: 'AI/ML', gpt: 'AI/ML', ml: 'AI/ML', nlp: 'AI/ML',
  vector: 'AI/ML', embedding: 'AI/ML', transformer: 'AI/ML', rag: 'AI/ML',
  agent: 'AI/ML', copilot: 'AI/ML',
  blockchain: 'Web3', crypto: 'Web3', defi: 'Web3', nft: 'Web3',
  web3: 'Web3', dao: 'Web3',
  saas: 'SaaS', platform: 'SaaS', marketplace: 'SaaS',
  fintech: 'Fintech', payments: 'Fintech',
  kubernetes: 'Dev Tools', docker: 'Dev Tools', devops: 'Dev Tools',
  cli: 'Dev Tools', sdk: 'Dev Tools', api: 'Dev Tools', graphql: 'Dev Tools',
  rust: 'Dev Tools', golang: 'Dev Tools', typescript: 'Dev Tools',
  serverless: 'Dev Tools', microservices: 'Dev Tools',
}

function getCategory(keyword: string): string {
  const lower = keyword.toLowerCase()
  for (const [term, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(term)) return category
  }
  return 'Other'
}

function tokenizeTitle(title: string): string[] {
  // Remove punctuation, lowercase, split by whitespace
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

function extractNgramPhrases(title: string): string[] {
  const words = tokenizeTitle(title)
  const phrases: string[] = []

  // Unigrams
  for (const word of words) {
    if (TECH_TERMS.has(word)) {
      phrases.push(word)
    }
  }

  // Bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`
    if (TECH_TERMS.has(bigram)) {
      phrases.push(bigram)
    }
  }

  return phrases
}

function extractFromHN(items: HNItem[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const phrases = extractNgramPhrases(item.title)
    for (const phrase of phrases) {
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1)
    }
  }
  return counts
}

function extractFromGitHub(repos: GitHubRepo[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const repo of repos) {
    // Extract from topics
    for (const topic of repo.topics) {
      const normalized = topic.toLowerCase().replace(/-/g, ' ')
      if (TECH_TERMS.has(normalized) || normalized.length > 2) {
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
      }
    }

    // Extract from description
    if (repo.description) {
      const phrases = extractNgramPhrases(repo.description)
      for (const phrase of phrases) {
        counts.set(phrase, (counts.get(phrase) ?? 0) + 1)
      }
    }

    // Language as a keyword
    if (repo.language) {
      const lang = repo.language.toLowerCase()
      counts.set(lang, (counts.get(lang) ?? 0) + 1)
    }
  }
  return counts
}

function extractFromTrends(trends: TrendItem[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const trend of trends) {
    if (trend.isRising || trend.velocity > 5) {
      // Normalize trend term
      const term = trend.term.toLowerCase()
      counts.set(term, Math.max(1, Math.round(trend.velocity / 10)))
    }
  }
  return counts
}

export function extractKeywords(
  hnItems: HNItem[],
  githubRepos: GitHubRepo[],
  trends: TrendItem[]
): ExtractedKeyword[] {
  const hnCounts = extractFromHN(hnItems)
  const githubCounts = extractFromGitHub(githubRepos)
  const trendCounts = extractFromTrends(trends)

  // Collect all unique keywords
  const allKeywords = new Set([
    ...Array.from(hnCounts.keys()),
    ...Array.from(githubCounts.keys()),
    ...Array.from(trendCounts.keys()),
  ])

  const keywords: ExtractedKeyword[] = []

  for (const keyword of Array.from(allKeywords)) {
    const hn = hnCounts.get(keyword) ?? 0
    const github = githubCounts.get(keyword) ?? 0
    const trendsCount = trendCounts.get(keyword) ?? 0

    // Filter out noise: require at least 1 mention from 1 source
    if (hn + github + trendsCount < 1) continue

    keywords.push({
      keyword,
      category: getCategory(keyword),
      sourceCounts: { hn, github, trends: trendsCount },
    })
  }

  // Sort by total mentions descending
  return keywords.sort(
    (a, b) =>
      b.sourceCounts.hn +
      b.sourceCounts.github +
      b.sourceCounts.trends -
      (a.sourceCounts.hn + a.sourceCounts.github + a.sourceCounts.trends)
  )
}
