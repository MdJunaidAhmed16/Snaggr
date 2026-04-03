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
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') ?? ''
    const minScore = parseFloat(searchParams.get('min_score') ?? '0')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

    // Check cache (only for default params)
    const isDefaultParams = !category && minScore === 0 && limit === 20
    if (isDefaultParams) {
      const cached = await getCachedFeed<TrendingDomainRecord[]>(CACHE_KEY)
      if (cached) {
        return NextResponse.json({ domains: cached, cached: true })
      }
    }

    // Query database
    let query: ReturnType<typeof sql>

    if (category) {
      query = sql`
        SELECT
          ds.id,
          ds.domain,
          ds.tld,
          tk.keyword,
          tk.category,
          tk.trend_score,
          tk.sources,
          ds.reasoning,
          ds.is_available,
          ds.purchase_url,
          ds.price_usd,
          ds.created_at
        FROM domain_suggestions ds
        LEFT JOIN trend_keywords tk ON ds.keyword_id = tk.id
        WHERE tk.trend_score >= ${minScore}
          AND tk.category = ${category}
          AND ds.is_available = true
        ORDER BY tk.trend_score DESC, ds.created_at DESC
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT
          ds.id,
          ds.domain,
          ds.tld,
          tk.keyword,
          tk.category,
          tk.trend_score,
          tk.sources,
          ds.reasoning,
          ds.is_available,
          ds.purchase_url,
          ds.price_usd,
          ds.created_at
        FROM domain_suggestions ds
        LEFT JOIN trend_keywords tk ON ds.keyword_id = tk.id
        WHERE tk.trend_score >= ${minScore}
          AND ds.is_available = true
        ORDER BY tk.trend_score DESC, ds.created_at DESC
        LIMIT ${limit}
      `
    }

    const { rows } = await query

    // Enrich with view counts from Redis
    const domains: TrendingDomainRecord[] = await Promise.all(
      rows.map(async (row) => ({
        ...(row as unknown as Omit<TrendingDomainRecord, 'views_today'>),
        views_today: await getViewCount(row.id as number),
      }))
    )

    // Cache default results
    if (isDefaultParams) {
      await setCachedFeed(CACHE_KEY, domains, CACHE_TTL)
    }

    return NextResponse.json({ domains, cached: false })
  } catch (error) {
    console.error('/api/trending-domains error:', error)

    // Return mock data so the UI doesn't break during development
    const mockDomains = getMockTrendingDomains()
    return NextResponse.json({ domains: mockDomains, cached: false, mock: true })
  }
}

function getMockTrendingDomains(): TrendingDomainRecord[] {
  return [
    {
      id: 1,
      domain: 'agentlayer.io',
      tld: 'io',
      keyword: 'autonomous agent',
      category: 'AI/ML',
      trend_score: 87.5,
      reasoning: 'The infrastructure layer for autonomous AI agents — arrives just as agent frameworks are exploding.',
      is_available: true,
      purchase_url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=agentlayer.io',
      price_usd: 29.99,
      sources: { hn: 12, github: 8, trends: 94 },
      created_at: new Date().toISOString(),
      views_today: 47,
    },
    {
      id: 2,
      domain: 'ragstack.dev',
      tld: 'dev',
      keyword: 'retrieval augmented generation',
      category: 'AI/ML',
      trend_score: 82.1,
      reasoning: 'The go-to stack for RAG-based applications — clean, technical, memorable.',
      is_available: true,
      purchase_url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=ragstack.dev',
      price_usd: 14.99,
      sources: { hn: 9, github: 15, trends: 76 },
      created_at: new Date().toISOString(),
      views_today: 31,
    },
    {
      id: 3,
      domain: 'vectorvault.ai',
      tld: 'ai',
      keyword: 'vector database',
      category: 'AI/ML',
      trend_score: 74.3,
      reasoning: 'Vector storage made simple — the vault metaphor signals security and reliability.',
      is_available: true,
      purchase_url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=vectorvault.ai',
      price_usd: 59.99,
      sources: { hn: 6, github: 11, trends: 68 },
      created_at: new Date().toISOString(),
      views_today: 28,
    },
    {
      id: 4,
      domain: 'edgeforge.dev',
      tld: 'dev',
      keyword: 'edge computing',
      category: 'Dev Tools',
      trend_score: 65.8,
      reasoning: 'Build at the edge — forge suggests craftsmanship and power at the infrastructure level.',
      is_available: true,
      purchase_url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=edgeforge.dev',
      price_usd: 14.99,
      sources: { hn: 5, github: 9, trends: 52 },
      created_at: new Date().toISOString(),
      views_today: 19,
    },
    {
      id: 5,
      domain: 'flowmesh.io',
      tld: 'io',
      keyword: 'microservices',
      category: 'Dev Tools',
      trend_score: 61.2,
      reasoning: 'Microservice orchestration as a mesh — flow implies ease, mesh implies connectivity.',
      is_available: true,
      purchase_url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=flowmesh.io',
      price_usd: 24.99,
      sources: { hn: 4, github: 13, trends: 41 },
      created_at: new Date().toISOString(),
      views_today: 15,
    },
    {
      id: 6,
      domain: 'zeroproof.co',
      tld: 'co',
      keyword: 'zero trust',
      category: 'Dev Tools',
      trend_score: 58.7,
      reasoning: 'Zero trust security platform — zeroproof is clever wordplay on zero-knowledge and zero-trust.',
      is_available: true,
      purchase_url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=zeroproof.co',
      price_usd: 19.99,
      sources: { hn: 7, github: 6, trends: 38 },
      created_at: new Date().toISOString(),
      views_today: 22,
    },
  ]
}
