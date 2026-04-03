import { NextRequest, NextResponse } from 'next/server'
import { getCachedFeed, setCachedFeed, redis } from '@/lib/cache/redis'
import { generateBusinessDomains } from '@/lib/llm'
import { bulkCheckAvailability } from '@/lib/domain/availability'
import { getAffiliateLink } from '@/lib/domain/affiliate'
import crypto from 'crypto'

// Rate limit: 5 LLM calls per IP per 10 minutes (cache hits are free)
async function checkRateLimit(ip: string): Promise<{ allowed: boolean }> {
  try {
    const key = `rl:suggest:${ip}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 600) // 10-minute window
    return { allowed: count <= 5 }
  } catch {
    return { allowed: true } // fail open if Redis is down
  }
}

export interface SuggestedDomain {
  domain: string
  reasoning: string
  available: boolean
  price?: number
  purchase_url: string
}

interface RequestBody {
  idea: string
  tlds?: string[]
  count?: number
}

const CACHE_TTL = 3600 // 1 hour

function getLLMConfigError(): string | null {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() ?? 'anthropic'
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    return 'GEMINI_API_KEY is not set in your environment variables'
  }
  if (provider !== 'gemini' && !process.env.ANTHROPIC_API_KEY) {
    return 'ANTHROPIC_API_KEY is not set. Set it, or set LLM_PROVIDER=gemini with a GEMINI_API_KEY'
  }
  return null
}

export async function POST(request: NextRequest) {
  const configError = getLLMConfigError()
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 })
  }

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const body: RequestBody = await request.json()

    if (!body.idea || typeof body.idea !== 'string' || body.idea.trim().length === 0) {
      return NextResponse.json(
        { error: 'idea is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const idea = body.idea.trim().slice(0, 500) // cap length

    // Whitelist allowed TLDs — never pass user strings directly into the LLM prompt
    const ALLOWED_TLDS = ['.com', '.io', '.dev', '.ai', '.co', '.net', '.org', '.app', '.xyz']
    const rawTlds = Array.isArray(body.tlds) ? body.tlds : ['.com', '.io', '.dev', '.ai', '.co']
    const tlds = rawTlds
      .filter((t): t is string => typeof t === 'string' && ALLOWED_TLDS.includes(t))
      .slice(0, 6) // max 6 TLDs
    if (tlds.length === 0) {
      return NextResponse.json({ error: 'No valid TLDs provided' }, { status: 400 })
    }

    // Create cache key from hash of idea + tlds
    const hash = crypto
      .createHash('sha256')
      .update(idea + JSON.stringify(tlds))
      .digest('hex')
      .slice(0, 16)
    const cacheKey = `llm:suggest:${hash}`

    // Check cache — cache hits skip rate limiting entirely
    const cached = await getCachedFeed<SuggestedDomain[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ domains: cached, cached: true })
    }

    // Rate limit only applies to actual LLM calls (5 per IP per 10 min)
    const { allowed } = await checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes before trying again.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }

    // Generate domain suggestions with Claude
    const generated = await generateBusinessDomains(idea, tlds)

    if (generated.length === 0) {
      return NextResponse.json({ error: 'Failed to generate domain suggestions' }, { status: 500 })
    }

    // Check availability for all generated domains in parallel
    const domainNames = generated.map((g) => g.domain)
    const availabilityMap = await bulkCheckAvailability(domainNames)

    // Build result with availability info
    const domains: SuggestedDomain[] = generated.map((g) => {
      const avail = availabilityMap.get(g.domain)
      return {
        domain: g.domain,
        reasoning: g.reasoning,
        available: avail?.available ?? false,
        price: avail?.price,
        purchase_url: getAffiliateLink(g.domain),
      }
    })

    // Cache the result
    await setCachedFeed(cacheKey, domains, CACHE_TTL)

    return NextResponse.json({ domains, cached: false })
  } catch (error) {
    console.error('/api/suggest-domains error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate domain suggestions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
