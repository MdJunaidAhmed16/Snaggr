import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { getCachedFeed, setCachedFeed, getViewCount } from '@/lib/cache/redis'

export interface TrendingDomainRecord {
  id: number
  domain: string
  tld: string
  keyword: string
  category: string
  trend_score: number
  reasoning: string
  is_available: boolean
  purchase_url: string | null
  price_usd: number | null
  sources: Record<string, unknown> | null
  created_at: string
  views_today: number
}

const CACHE_KEY = 'feed:trending'
const CACHE_TTL = 1800 // 30 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? ''

  try {
    const minScore = parseFloat(searchParams.get('min_score') ?? '0')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30', 10), 100)
    const maxPrice = parseFloat(searchParams.get('max_price') ?? '0') // 0 = no limit

    const isDefaultParams = !category && minScore === 0 && limit === 30 && maxPrice === 0
    if (isDefaultParams) {
      const cached = await getCachedFeed<TrendingDomainRecord[]>(CACHE_KEY)
      if (cached) {
        return NextResponse.json({ domains: cached, cached: true })
      }
    }

    let query: ReturnType<typeof sql>

    if (category) {
      query = sql`
        SELECT ds.id, ds.domain, ds.tld, tk.keyword, tk.category, tk.trend_score,
               tk.sources, ds.reasoning, ds.is_available, ds.purchase_url, ds.price_usd, ds.created_at
        FROM domain_suggestions ds
        LEFT JOIN trend_keywords tk ON ds.keyword_id = tk.id
        WHERE tk.trend_score >= ${minScore}
          AND tk.category = ${category}
          AND ds.is_available = true
          AND (${maxPrice} = 0 OR ds.price_usd <= ${maxPrice})
        ORDER BY tk.trend_score DESC, ds.created_at DESC
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT ds.id, ds.domain, ds.tld, tk.keyword, tk.category, tk.trend_score,
               tk.sources, ds.reasoning, ds.is_available, ds.purchase_url, ds.price_usd, ds.created_at
        FROM domain_suggestions ds
        LEFT JOIN trend_keywords tk ON ds.keyword_id = tk.id
        WHERE tk.trend_score >= ${minScore}
          AND ds.is_available = true
          AND (${maxPrice} = 0 OR ds.price_usd <= ${maxPrice})
        ORDER BY tk.trend_score DESC, ds.created_at DESC
        LIMIT ${limit}
      `
    }

    const { rows } = await query

    const domains: TrendingDomainRecord[] = await Promise.all(
      rows.map(async (row) => ({
        ...(row as unknown as Omit<TrendingDomainRecord, 'views_today'>),
        views_today: await getViewCount(row.id as number),
      }))
    )

    if (isDefaultParams) {
      await setCachedFeed(CACHE_KEY, domains, CACHE_TTL)
    }

    return NextResponse.json({ domains, cached: false })
  } catch (error) {
    console.error('/api/trending-domains error:', error)
    const mockDomains = getMockTrendingDomains(category, parseFloat(searchParams.get('max_price') ?? '0'))
    return NextResponse.json({ domains: mockDomains, cached: false, mock: true })
  }
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Used only when the DB is not yet connected. Domains use uncommon name patterns
// to reduce chance of hitting registered domains, but availability is unverified.

const ALL_MOCK_DOMAINS: TrendingDomainRecord[] = [
  // AI/ML
  { id: 1,  domain: 'agentflux.io',      tld: 'io',  keyword: 'autonomous agents',          category: 'AI/ML',     trend_score: 91.2, reasoning: 'Flux signals dynamic, ever-changing agent workflows — memorable, sharp, and very startup-y.',            is_available: true, purchase_url: null, price_usd: 32.99, sources: { hn: 14, github: 9, trends: 88 },  created_at: new Date().toISOString(), views_today: 52 },
  { id: 2,  domain: 'ragpipeline.dev',   tld: 'dev', keyword: 'retrieval augmented gen',    category: 'AI/ML',     trend_score: 86.4, reasoning: 'Directly names the pattern — developers searching for RAG tooling will recognise this instantly.',        is_available: true, purchase_url: null, price_usd: 13.99, sources: { hn: 10, github: 17, trends: 74 }, created_at: new Date().toISOString(), views_today: 38 },
  { id: 3,  domain: 'embediq.io',        tld: 'io',  keyword: 'embeddings infrastructure',  category: 'AI/ML',     trend_score: 79.8, reasoning: 'Embed + IQ — short, punchy, and implies intelligent embedding management.',                              is_available: true, purchase_url: null, price_usd: 28.99, sources: { hn: 8,  github: 12, trends: 69 }, created_at: new Date().toISOString(), views_today: 29 },
  { id: 4,  domain: 'promptstudio.dev',  tld: 'dev', keyword: 'prompt engineering',         category: 'AI/ML',     trend_score: 74.1, reasoning: 'Studio implies a workspace — positions the product as the IDE for prompts.',                              is_available: true, purchase_url: null, price_usd: 13.99, sources: { hn: 7,  github: 11, trends: 64 }, created_at: new Date().toISOString(), views_today: 23 },
  { id: 5,  domain: 'vectorhub.ai',      tld: 'ai',  keyword: 'vector database',             category: 'AI/ML',     trend_score: 70.3, reasoning: 'Hub signals a central repository — developers store and query vectors here.',                             is_available: true, purchase_url: null, price_usd: 64.99, sources: { hn: 6,  github: 9,  trends: 58 }, created_at: new Date().toISOString(), views_today: 18 },
  { id: 6,  domain: 'neuralvault.co',    tld: 'co',  keyword: 'AI model storage',            category: 'AI/ML',     trend_score: 65.7, reasoning: 'Vault implies secure, organised storage of trained models — enterprise-friendly branding.',                is_available: true, purchase_url: null, price_usd: 11.99, sources: { hn: 5,  github: 7,  trends: 53 }, created_at: new Date().toISOString(), views_today: 14 },
  // SaaS
  { id: 7,  domain: 'nudgemetrics.io',   tld: 'io',  keyword: 'product analytics',           category: 'SaaS',      trend_score: 73.5, reasoning: 'Nudge implies actionable insights, metrics is the core product — together they signal data-driven growth.', is_available: true, purchase_url: null, price_usd: 28.99, sources: { hn: 9,  github: 4,  trends: 63 }, created_at: new Date().toISOString(), views_today: 35 },
  { id: 8,  domain: 'retainflow.io',     tld: 'io',  keyword: 'churn reduction',             category: 'SaaS',      trend_score: 68.9, reasoning: 'Retain is the goal, flow is the mechanism — a clean metaphor for keeping customers moving through the funnel.', is_available: true, purchase_url: null, price_usd: 28.99, sources: { hn: 7,  github: 3,  trends: 58 }, created_at: new Date().toISOString(), views_today: 27 },
  { id: 9,  domain: 'boardsync.app',     tld: 'app', keyword: 'async collaboration',         category: 'SaaS',      trend_score: 63.2, reasoning: 'Board + sync — async-first team collaboration with a familiar Kanban metaphor.',                           is_available: true, purchase_url: null, price_usd: 18.99, sources: { hn: 6,  github: 2,  trends: 54 }, created_at: new Date().toISOString(), views_today: 21 },
  { id: 10, domain: 'onboardly.app',     tld: 'app', keyword: 'user onboarding',             category: 'SaaS',      trend_score: 58.4, reasoning: 'The -ly suffix signals a SaaS tool — friendly, approachable, and immediately describes its purpose.',       is_available: true, purchase_url: null, price_usd: 18.99, sources: { hn: 5,  github: 2,  trends: 47 }, created_at: new Date().toISOString(), views_today: 16 },
  { id: 11, domain: 'churnstopper.co',   tld: 'co',  keyword: 'customer retention',          category: 'SaaS',      trend_score: 54.1, reasoning: 'Blunt, memorable, and says exactly what it does — customers will remember this name.',                    is_available: true, purchase_url: null, price_usd: 11.99, sources: { hn: 4,  github: 1,  trends: 44 }, created_at: new Date().toISOString(), views_today: 11 },
  // Dev Tools
  { id: 12, domain: 'edgerunner.dev',    tld: 'dev', keyword: 'edge computing',              category: 'Dev Tools', trend_score: 67.4, reasoning: 'Runner suggests execution at the edge — fast, distributed, and infrastructure-native branding.',            is_available: true, purchase_url: null, price_usd: 13.99, sources: { hn: 6,  github: 10, trends: 55 }, created_at: new Date().toISOString(), views_today: 24 },
  { id: 13, domain: 'hookstream.io',     tld: 'io',  keyword: 'webhooks infrastructure',     category: 'Dev Tools', trend_score: 62.8, reasoning: 'Hook + stream — a real-time pipeline for webhook delivery, the name explains the architecture.',            is_available: true, purchase_url: null, price_usd: 28.99, sources: { hn: 5,  github: 9,  trends: 49 }, created_at: new Date().toISOString(), views_today: 19 },
  { id: 14, domain: 'audittrailx.dev',   tld: 'dev', keyword: 'compliance logging',          category: 'Dev Tools', trend_score: 58.1, reasoning: 'Audit trail is the compliance term every enterprise knows — X signals the modern, developer-first version.', is_available: true, purchase_url: null, price_usd: 13.99, sources: { hn: 4,  github: 8,  trends: 44 }, created_at: new Date().toISOString(), views_today: 14 },
  { id: 15, domain: 'meshflow.io',       tld: 'io',  keyword: 'microservices orchestration', category: 'Dev Tools', trend_score: 53.6, reasoning: 'Mesh + flow — service mesh management with an emphasis on smooth, observable traffic.',                     is_available: true, purchase_url: null, price_usd: 28.99, sources: { hn: 4,  github: 7,  trends: 41 }, created_at: new Date().toISOString(), views_today: 11 },
  { id: 16, domain: 'zeroproofx.co',     tld: 'co',  keyword: 'zero trust security',         category: 'Dev Tools', trend_score: 49.3, reasoning: 'Zero trust + proof — security tooling with a clever wordplay on zero-knowledge proofs.',                   is_available: true, purchase_url: null, price_usd: 11.99, sources: { hn: 5,  github: 5,  trends: 37 }, created_at: new Date().toISOString(), views_today: 9  },
  // Fintech
  { id: 17, domain: 'settlr.io',         tld: 'io',  keyword: 'payments infrastructure',     category: 'Fintech',   trend_score: 80.2, reasoning: 'Settlement is the core of payments — the -r suffix makes it startup-friendly without losing the meaning.',  is_available: true, purchase_url: null, price_usd: 34.99, sources: { hn: 11, github: 5,  trends: 74 }, created_at: new Date().toISOString(), views_today: 44 },
  { id: 18, domain: 'vaultledger.co',    tld: 'co',  keyword: 'embedded finance',            category: 'Fintech',   trend_score: 74.6, reasoning: 'Vault + ledger — security and accounting in one name, ideal for embedded banking or audit tooling.',       is_available: true, purchase_url: null, price_usd: 11.99, sources: { hn: 9,  github: 4,  trends: 68 }, created_at: new Date().toISOString(), views_today: 36 },
  { id: 19, domain: 'clearfunds.app',    tld: 'app', keyword: 'financial analytics',         category: 'Fintech',   trend_score: 69.1, reasoning: 'Clarity in financial data — clear signals transparency, funds is the product domain.',                      is_available: true, purchase_url: null, price_usd: 18.99, sources: { hn: 7,  github: 3,  trends: 61 }, created_at: new Date().toISOString(), views_today: 28 },
  { id: 20, domain: 'remitnow.io',       tld: 'io',  keyword: 'cross-border payments',       category: 'Fintech',   trend_score: 63.4, reasoning: 'Remit is the financial term, now is the value prop — instant cross-border transfers in two words.',          is_available: true, purchase_url: null, price_usd: 28.99, sources: { hn: 6,  github: 2,  trends: 54 }, created_at: new Date().toISOString(), views_today: 21 },
  // Other
  { id: 21, domain: 'carbonledger.dev',  tld: 'dev', keyword: 'carbon tracking',             category: 'Other',     trend_score: 57.3, reasoning: 'ESG compliance tooling — ledger implies auditability, carbon is the domain. Strong enterprise SEO.',       is_available: true, purchase_url: null, price_usd: 13.99, sources: { hn: 4,  github: 7,  trends: 41 }, created_at: new Date().toISOString(), views_today: 13 },
  { id: 22, domain: 'skillgraphx.io',    tld: 'io',  keyword: 'workforce skills mapping',    category: 'Other',     trend_score: 52.8, reasoning: 'Graph your team\'s skills — technical, clear, and maps naturally to org-chart tooling.',                   is_available: true, purchase_url: null, price_usd: 28.99, sources: { hn: 3,  github: 6,  trends: 37 }, created_at: new Date().toISOString(), views_today: 10 },
  { id: 23, domain: 'talentmesh.co',     tld: 'co',  keyword: 'talent acquisition',          category: 'Other',     trend_score: 48.5, reasoning: 'Mesh implies a connected network of talent — fits recruiting platforms, skills marketplaces, or team tools.', is_available: true, purchase_url: null, price_usd: 11.99, sources: { hn: 3,  github: 4,  trends: 33 }, created_at: new Date().toISOString(), views_today: 8  },
]

function getMockTrendingDomains(category: string, maxPrice: number): TrendingDomainRecord[] {
  let results = category
    ? ALL_MOCK_DOMAINS.filter((d) => d.category === category)
    : ALL_MOCK_DOMAINS
  if (maxPrice > 0) {
    results = results.filter((d) => d.price_usd !== null && d.price_usd <= maxPrice)
  }
  return results
}
