import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { getCachedFeed, setCachedFeed } from '@/lib/cache/redis'
import { getAffiliateLink } from '@/lib/domain/affiliate'

export interface ExpiringDomainRecord {
  id: number
  domain: string
  expiry_date: string
  backlink_count: number
  domain_age_years: number
  registrar: string
  has_active_business: boolean
  score: number
  days_until_expiry: number
  purchase_url: string
}

const CACHE_KEY = 'feed:expiring'
const CACHE_TTL = 21600 // 6 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minBacklinks = parseInt(searchParams.get('min_backlinks') ?? '0', 10)
    const expiresWithinDays = parseInt(searchParams.get('expires_within_days') ?? '90', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

    const isDefaultParams =
      minBacklinks === 0 && expiresWithinDays === 90 && limit === 20

    // Check cache for default params
    if (isDefaultParams) {
      const cached = await getCachedFeed<ExpiringDomainRecord[]>(CACHE_KEY)
      if (cached) {
        return NextResponse.json({ domains: cached, cached: true })
      }
    }

    // Try to query the database
    try {
      const { rows } = await sql`
        SELECT
          id,
          domain,
          expiry_date::text,
          backlink_count,
          domain_age_years,
          registrar,
          has_active_business,
          score,
          EXTRACT(DAY FROM (expiry_date - CURRENT_DATE))::int AS days_until_expiry
        FROM expiring_domains
        WHERE
          backlink_count >= ${minBacklinks}
          AND expiry_date <= CURRENT_DATE + INTERVAL '1 day' * ${expiresWithinDays}
          AND expiry_date >= CURRENT_DATE
        ORDER BY score DESC, expiry_date ASC
        LIMIT ${limit}
      `

      const domains: ExpiringDomainRecord[] = rows.map((row) => ({
        ...(row as unknown as Omit<ExpiringDomainRecord, 'purchase_url'>),
        purchase_url: getAffiliateLink(row.domain as string),
      }))

      if (isDefaultParams && domains.length > 0) {
        await setCachedFeed(CACHE_KEY, domains, CACHE_TTL)
      }

      // Fall back to mock if no data in DB
      if (domains.length === 0) {
        return NextResponse.json({ domains: getMockExpiringDomains(), cached: false, mock: true })
      }

      return NextResponse.json({ domains, cached: false })
    } catch {
      // DB not set up — return mock data
      return NextResponse.json({ domains: getMockExpiringDomains(), cached: false, mock: true })
    }
  } catch (error) {
    console.error('/api/expiring-domains error:', error)
    return NextResponse.json({ domains: getMockExpiringDomains(), cached: false, mock: true })
  }
}

function getMockExpiringDomains(): ExpiringDomainRecord[] {
  const now = new Date()

  const addDays = (days: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  return [
    {
      id: 1,
      domain: 'cloudpivot.io',
      expiry_date: addDays(4),
      backlink_count: 1247,
      domain_age_years: 6,
      registrar: 'GoDaddy',
      has_active_business: true,
      score: 92.4,
      days_until_expiry: 4,
      purchase_url: getAffiliateLink('cloudpivot.io'),
    },
    {
      id: 2,
      domain: 'stackbloom.dev',
      expiry_date: addDays(7),
      backlink_count: 834,
      domain_age_years: 4,
      registrar: 'Namecheap',
      has_active_business: false,
      score: 85.1,
      days_until_expiry: 7,
      purchase_url: getAffiliateLink('stackbloom.dev'),
    },
    {
      id: 3,
      domain: 'aiworkflow.co',
      expiry_date: addDays(12),
      backlink_count: 2103,
      domain_age_years: 3,
      registrar: 'Google Domains',
      has_active_business: true,
      score: 88.7,
      days_until_expiry: 12,
      purchase_url: getAffiliateLink('aiworkflow.co'),
    },
    {
      id: 4,
      domain: 'webhookr.com',
      expiry_date: addDays(18),
      backlink_count: 445,
      domain_age_years: 8,
      registrar: 'Namecheap',
      has_active_business: false,
      score: 72.3,
      days_until_expiry: 18,
      purchase_url: getAffiliateLink('webhookr.com'),
    },
    {
      id: 5,
      domain: 'mintpayments.io',
      expiry_date: addDays(22),
      backlink_count: 3891,
      domain_age_years: 5,
      registrar: 'GoDaddy',
      has_active_business: true,
      score: 95.2,
      days_until_expiry: 22,
      purchase_url: getAffiliateLink('mintpayments.io'),
    },
    {
      id: 6,
      domain: 'codeflare.dev',
      expiry_date: addDays(31),
      backlink_count: 678,
      domain_age_years: 2,
      registrar: 'Cloudflare',
      has_active_business: false,
      score: 68.9,
      days_until_expiry: 31,
      purchase_url: getAffiliateLink('codeflare.dev'),
    },
    {
      id: 7,
      domain: 'shipfast.ai',
      expiry_date: addDays(45),
      backlink_count: 1567,
      domain_age_years: 1,
      registrar: 'Namecheap',
      has_active_business: true,
      score: 83.4,
      days_until_expiry: 45,
      purchase_url: getAffiliateLink('shipfast.ai'),
    },
    {
      id: 8,
      domain: 'devpulse.io',
      expiry_date: addDays(67),
      backlink_count: 921,
      domain_age_years: 7,
      registrar: 'GoDaddy',
      has_active_business: false,
      score: 76.6,
      days_until_expiry: 67,
      purchase_url: getAffiliateLink('devpulse.io'),
    },
  ]
}
